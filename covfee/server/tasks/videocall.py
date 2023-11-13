import requests
from flask import current_app as app

from .base import BaseCovfeeTask
from covfee.logger import logger

OPENVIDU_URL = "http://192.168.0.22:4443/"
OPENVIDU_SECRET = "MY_SECRET"


class VideocallTask(BaseCovfeeTask):
    def _request_session_id(self):
        try:
            response = requests.post(
                OPENVIDU_URL + "openvidu/api/sessions",
                verify=False,
                auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                headers={"Content-type": "application/json"},
                json={
                    "mediaMode": "ROUTED",
                    "recordingMode": "MANUAL",
                    "customSessionId": str(self.task.id),
                },
            )
            response.raise_for_status()
            return response.json()["sessionId"]
        except requests.exceptions.HTTPError as err:
            if err.response.status_code == 409:
                # Session already exists in OpenVidu
                app.logger.warn(
                    f"_request_session_id called but session already exists for session_id {str(self.task.id)}"
                )
                return str(self.task.id)
            else:
                return None

    def _request_connection_token(self, session_id, journey_id):
        return requests.post(
            OPENVIDU_URL + "openvidu/api/sessions/" + session_id + "/connection",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={"Content-type": "application/json"},
            json={"data": journey_id},
        ).json()["token"]

    def on_join(self, journey):
        logger.info("VideocallTask:on_join")
        # retrieve or request a session ID for the call / room
        session_id = self._request_session_id()

        if session_id is None:
            return {}

        connection_token = self._request_connection_token(session_id, journey.id.hex())

        return {"session_id": session_id, "connection_token": connection_token}
