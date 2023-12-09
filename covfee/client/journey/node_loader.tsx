import * as React from "react"
import styled from "styled-components"
import ReactDOM from "react-dom"
import { Button, Modal, Popover, Result, Spin } from "antd"

import { JourneyContext } from "./journey_context"
import { myerror } from "../utils"
import { getTask } from "../task_utils"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { BaseTaskProps, CovfeeTask } from "tasks/base"
import { useNode } from "../models/Node"
import { NodeStatuses, NodeType } from "../types/node"
import { AllPropsRequired } from "../types/utils"
import { nodeContext } from "./node_context"
import { Provider as StoreProvider, useDispatch } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { appContext } from "../app_context"

interface Props {
  /**
   * Task props and specification
   */
  node: NodeType
  /**
   * If true, the task cannot be interacted with
   */
  disabled?: boolean
  /**
   * If true, the task is only previewed: submission and server communication are disabled.
   * Used for previews and playground where no server is available.
   */
  previewMode?: boolean

  // CALLBACKS
  /**
   * To be called when the task is submitted.
   */
  onSubmit?: () => void
}

export const NodeLoader: React.FC<Props> = (props: Props) => {
  const args: AllPropsRequired<Props> = {
    disabled: false,
    previewMode: false,
    onSubmit: () => {},
    ...props,
  }

  const { socket, chocket } = React.useContext(appContext)
  const { id: journeyId } = React.useContext(JourneyContext)

  const {
    node,
    setNode,
    response,
    makeResponse,
    setStatus: setNodeStatus,
    fetchResponse,
    submitResponse,
  } = useNode(args.node, socket)

  const [isLoading, setIsLoading] = React.useState(true)
  const [instructionsVisible, setInstructionsVisible] = React.useState(false)
  const [reloadCount, setReloadCount] = React.useState<number>(0)
  const [reloadMessage, setReloadMessage] = React.useState<string>(null)
  const [overlayVisible, setOverlayVisible] = React.useState(false)
  const [error, setError] = React.useState<{
    error: boolean
    show?: boolean
    message?: string
    abort?: boolean
  }>({ error: false })

  const nodeInstructionsRef = React.useRef(null)

  const {
    taskComponent,
    taskReducer,
    useSharedState: taskRequestsSharedState,
  } = getTask(args.node.spec.type)

  const taskuseSharedState =
    taskRequestsSharedState !== undefined ? taskRequestsSharedState : false
  const useSharedState =
    args.node.useSharedState !== undefined
      ? args.node.useSharedState
      : taskuseSharedState

  const reduxStore = React.useRef(
    configureStore({
      reducer: taskReducer,
    })
  )

  React.useEffect(() => {
    fetchResponse()
  }, [fetchResponse])

  React.useEffect(() => {
    if (socket) {
      socket.emit("join", {
        journeyId,
        nodeId: args.node.id,
        useSharedState,
      })
    }
  }, [socket, journeyId, useSharedState, args.node.id])

  React.useEffect(() => {
    if (response) {
      // update the state when the response is loaded
      console.log("Updating reduxStore", response.state)
      const action = { type: "task/setState", payload: response.state }
      reduxStore.current.dispatch(action)
    }
  }, [response])

  React.useEffect(() => {
    if (response && socket) {
      socket.on("status", (data) => {
        console.log("IO: status", data)
        if (data.response_id !== response.id) {
          // the task was reset or a new response was created
          // fetch the new one and let the user know
          // fetchResponse()
          setReloadCount(10)
          setReloadMessage(
            "The task has been reset by the admin. Restarting..."
          )
          setTimeout(() => {
            window.location.reload()
          }, 10000)
        }
      })
    }
  }, [fetchResponse, response, socket])

  React.useEffect(() => {
    // Only set up the interval if count is greater than 0
    if (reloadCount > 0) {
      const timerId = setInterval(() => {
        setReloadCount(reloadCount - 1)
      }, 1000)

      // Clear the interval on component unmount or when the count changes
      return () => clearInterval(timerId)
    }
  }, [reloadCount])

  React.useEffect(() => {
    socket.on("join", (data) => {
      if (data.error) {
        console.error("IO: on_join returned server error", data)
        setError({
          error: true,
          show: true,
          message: data.error,
          abort: data.load_task,
        })
      }
      setIsLoading(false)
    })

    socket.on("action", (action) => {
      reduxStore.current.dispatch(action)
    })

    socket.on("state", (state) => {
      const action = { type: "task/setState", payload: state.state }
      reduxStore.current.dispatch(action)
    })

    return () => {
      socket.removeAllListeners("join")
      socket.removeAllListeners("action")
      socket.removeAllListeners("state")
    }
  }, [socket])

  // React.useEffect(()=>{
  //   console.log([node, response])
  //   // check that all the node requirements are ready
  //   if(node.taskData !== undefined && response !== null) {
  //     setIsLoading(false)
  //   }
  // }, [node, response])

  const handleTaskSubmit = () => {
    submitResponse({ state: reduxStore.current.getState() })
      .then((data: any) => {
        setNodeStatus("FINISHED")
        args.onSubmit()
      })
      .catch((error) => {
        myerror("Error submitting the task.", error)
        setNodeStatus("FINISHED")
      })
  }

  const renderErrorMessage = React.useCallback(() => {
    return (
      <MessageContainer>
        <Result
          status="error"
          title="Error loading task"
          subTitle={error.message}
          extra={
            <p>
              Please try reloading the page. If the issue persists, contact the
              administrators.
            </p>
          }
        ></Result>
      </MessageContainer>
    )
  }, [error])

  // const getOverlayInitTimedTask = () => {
  //     return {
  //         title: 'This is a timed task!',
  //         subtext: 'Make sure to set up and be ready before you hit "Start". Once you do you will not be able to stop the countdown.',
  //         mainOptions: [
  //             <Button
  //                 type="primary"
  //                 onClick={()=>{}}
  //             >Start</Button>
  //         ]
  //     }
  // }

  /**
   * User must be able to:
   * - Restart the task if num_submissions < maxSubmissions
   * - Replay the submitted task
   * - Go to the next task
   */

  const hideInstructions = () => {
    setInstructionsVisible(false)
  }

  const handleInstructionsVisibleChange = (visible: boolean) => {
    setInstructionsVisible(visible)
  }

  const renderTaskInfo = (instructions: React.ReactNode = null) => {
    return (
      <Popover
        title="Instructions"
        placement="bottom"
        open={instructionsVisible}
        onOpenChange={handleInstructionsVisibleChange}
        content={
          <InstructionsPopoverContent>
            {node.spec.instructions}
            {instructions}
            <div style={{ textAlign: "right" }}>
              <Button type="primary" onClick={hideInstructions}>
                OK
              </Button>
            </div>
          </InstructionsPopoverContent>
        }
        trigger="click"
      >
        <div className="task-instructions-button">
          <QuestionCircleOutlined /> Instructions
        </div>
      </Popover>
    )
  }

  const renderTaskSubmitButton = (extraProps: any) => {
    return (
      <Button
        type="primary"
        {...extraProps}
        onClick={handleTaskSubmit}
        htmlType="submit"
        disabled={node.status !== "RUNNING"}
      >
        Submit
      </Button>
    )
  }

  if (isLoading) {
    return (
      <NodeLoaderMessage>
        <Spin tip="Loading" size="large">
          <div className="content" />
        </Spin>
      </NodeLoaderMessage>
    )
  }

  if (error.error) {
    return renderErrorMessage()
  }

  if (reloadCount > 0) {
    return <NodeOverlayReload counter={reloadCount} message={reloadMessage} />
  }

  if (node.status == "INIT") {
    return (
      <NodeLoaderMessage>
        <h1>Waiting for subjects...</h1>
        <Spin />
        <p>
          {node.curr_journeys.length} / {node.num_journeys} subjects present
        </p>
      </NodeLoaderMessage>
    )
  }

  if (node.status == "RUNNING" || node.status == "FINISHED") {
    if (node.type != "TaskInstance") {
      return (
        <NodeLoaderMessage>
          <h1>Unimplemented</h1>
        </NodeLoaderMessage>
      )
    }

    return (
      <>
        {/* {renderErrorModal()} */}
        <div ref={nodeInstructionsRef}></div>
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {node.paused && <NodeOverlayPaused />}

          <StoreProvider store={reduxStore.current}>
            <nodeContext.Provider value={{ node, useSharedState, response }}>
              {(() => {
                const nodeProps: BaseTaskProps = {
                  spec: node.spec,
                  taskData: node.taskData,
                  response: response,
                  disabled: args.disabled || node.status == "FINISHED",
                  onSubmit: handleTaskSubmit,
                  renderSubmitButton: renderTaskSubmitButton,
                }

                const taskElement = React.createElement(
                  taskComponent,
                  {
                    ...nodeProps,
                  },
                  null
                )

                console.log(
                  `${args.node.spec.type} built with status=${node.status}, paused=${node.paused}`,
                  nodeProps
                )

                return taskElement
              })()}
            </nodeContext.Provider>
          </StoreProvider>
        </div>
      </>
    )
  }
}

interface NodeLoaderMessageProps {
  children: React.ReactNode
}
export const NodeLoaderMessage = (props: NodeLoaderMessageProps) => {
  const args: AllPropsRequired<NodeLoaderMessageProps> = { ...props }

  return <NodeOverlay>{args.children}</NodeOverlay>
}

interface NodeOverlayProps {
  children: React.ReactNode
}
export const NodeOverlay = (props: NodeOverlayProps) => {
  const args: AllPropsRequired<NodeOverlayProps> = { ...props }

  return (
    <OverlayContainer>
      <div>{args.children}</div>
    </OverlayContainer>
  )
}

export const NodeOverlayPaused = () => {
  return (
    <NodeOverlay>
      <h2>The task has been paused by the admin</h2>
      <p>
        Please wait for instructions in the chat or for this message to
        dissapear.
      </p>
    </NodeOverlay>
  )
}

interface NodeOverlayReloadProps {
  counter: number
  message: string
}

export const NodeOverlayReload = ({
  counter,
  message,
}: NodeOverlayReloadProps) => {
  return (
    <NodeOverlay>
      <h2>{counter}</h2>
      <p>{message}</p>
    </NodeOverlay>
  )
}

const OverlayContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10;

  > div {
    width: 70%;
    padding: 5%;
    border-radius: 10px;
    background-color: #ddd;
    margin: 0 auto;
    text-align: center;
  }
`

const MessageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;

  > div {
    width: 70%;
    padding: 5%;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.1);
    margin: 0 auto;
    text-align: center;
  }
`

const InstructionsPopoverContent = styled.div`
  width: calc(30vw);
  max-height: calc(50vh);
`
