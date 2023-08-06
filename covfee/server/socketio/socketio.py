import hashlib
import hmac
from typing import Dict

from covfee.server.orm.chat import Chat, ChatMessage

from .. import tasks
from ..tasks.base import BaseCovfeeTask
from flask import current_app as app, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room, Namespace
from covfee.server.orm import (
    NodeInstance,
    TaskResponse,
    JourneyInstance,
    NodeInstanceStatus,
)
from covfee.server.socketio.redux_store import ReduxStoreClient


socketio = SocketIO()
store = ReduxStoreClient()


def get_journey(jid: str) -> JourneyInstance:
    return app.session.query(JourneyInstance).get(bytes.fromhex(jid))


def get_node(nodeId: int) -> NodeInstance:
    return app.session.query(NodeInstance).get(nodeId)


def get_response(responseId: int) -> TaskResponse:
    return app.session.query(TaskResponse).get(responseId)


def get_chat(chatId: int) -> Chat:
    return app.session.query(Chat).get(chatId)


def get_task_object(responseId: int):
    response = app.session.query(TaskResponse).get(responseId)
    if response is None:
        return None

    task = response.task
    task_class = getattr(tasks, task.spec.spec["type"], BaseCovfeeTask)
    task_object = task_class(response=response)
    return task_object


@socketio.on("connect")
def on_connect(data):
    print("CONNECT")


@socketio.on("join")
def on_join(data):
    journeyId = str(data["journeyId"])
    journey = get_journey(journeyId)

    nodeId = str(data["nodeId"])
    node = get_node(nodeId)

    responseId = str(data["responseId"])
    response = get_response(responseId)

    use_shared_state = data["useSharedState"]

    if journey is None or node is None:
        return send(f"Unable to join, journeyId={journeyId}, nodeId={nodeId}")

    if node not in journey.nodes:
        return send(
            f"Unable to join nodeId={nodeId} is not in journey journeyId={journeyId}"
        )

    join_room(responseId)
    # join_room(node.chat.id, namespace="/chat")
    prev_status = node.status
    # update the journey and node status
    journey.set_curr_node(node)
    app.session.commit()
    new_status = node.status

    # emit event if status changed
    if prev_status != new_status:
        payload = {"prev": prev_status, "new": new_status}
        emit("status", payload, to=responseId)

    print(f"joined room {responseId}")
    session["journeyId"] = journeyId
    session["responseId"] = responseId
    session.modified = True

    if use_shared_state:
        res = store.join(responseId, response.task.spec.spec["type"], response.state)
        if res["success"]:
            emit("state", res)

            # if this is the first join, run the on_first_join callback
            # if res['numConnections'] == 1:
            #     get_task_object(int(room)).on_first_join()

        else:
            send(f"Unable to join room id={responseId}")


@socketio.on("action")
def on_action(data):
    print("action")
    action = data["action"]
    responseId = str(data["responseId"])
    print(session)
    # if responseId != session["responseId"]:
    #     return send(
    #         f'data["responseId"] does not match session\'s responseId variable. {responseId} != {session["responseId"]}'
    #     )

    res = store.action(responseId, action)
    if res["success"]:
        emit("action", action, to=responseId)


def leave_store(responseId):
    print(f"Leaving response {responseId}")
    res = store.leave(responseId)
    if res["success"]:
        # save state to database
        response = get_response(responseId)
        response.state = res["state"]
        app.session.commit()


def leave_journey(journeyId):
    print(f"Leaving journey {journeyId}")
    journey = get_journey(journeyId)

    if journey is None:
        return ValueError(f"Unknown journeyID {journeyId}")

    journey.set_curr_node(None)
    app.session.commit()
    session["journeyId"] = None


@socketio.on("leave")
def on_leave(data):
    print(session)
    responseId = str(data["responseId"])
    if responseId != session["responseId"]:
        return send(
            f'data["responseId"] does not match session\'s responseId variable. {responseId} != {session["responseId"]}'
        )

    use_shared_state = data["useSharedState"]
    if use_shared_state:
        leave_store(responseId)

    # leave the room
    session["responseId"] = None
    leave_room(responseId)
    # if the room is now empty
    # if res["numConnections"] == 0:
    #     get_task_object(int(responseId)).on_last_leave()


@socketio.on("disconnect")
def disconnect():
    print("disconnect")
    if "responseId" in session:
        responseId = session["responseId"]
        leave_store(responseId)

    if "journeyId" in session:
        journeyId = session["journeyId"]
        leave_journey(journeyId)


### CHAT ###


def on_chat(data: Dict):
    print("MESSAGE")
    if "chatId" not in data:
        return send(f"chatId not sent")

    chatId = int(data["chatId"])
    message = ChatMessage(data["message"])
    chat = get_chat(chatId)
    if chat is None:
        return send(f"chat not found")
    chat.messages.append(message)
    app.session.commit()

    print("emmiting")
    # emit the message
    emit("message", message.to_dict(), to=chatId, namespace="/chat")

    # broadcast to admins
    emit("message", message.to_dict(), namespace="/admin_chat", broadcast=True)


socketio.on_event("message", on_chat, namespace="/chat")
socketio.on_event("message", on_chat, namespace="/admin_chat")


@socketio.on("join_chat", namespace="/chat")
def on_join_chat(data):
    print("JOIN CHAT")
    chatId = data["chatId"]
    chat = get_chat(chatId)

    if chat is None:
        return send(f"Unable to join, chatId={chatId}")

    join_room(chat.id, namespace="/chat")
    session["chatId"] = chatId
