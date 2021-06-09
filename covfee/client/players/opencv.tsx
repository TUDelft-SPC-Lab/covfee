/* global cv */
declare global {
    var cv: any
}
import * as React from 'react'
import { OpencvFlowPlayerMedia } from '@covfee-types/players/opencv'
import { urlReplacer, myinfo } from '../utils'
import { CovfeeContinuousPlayer, ContinuousPlayerProps } from './base'
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'

// video player using opencv to control playback speed
export interface Props extends ContinuousPlayerProps {
    media: OpencvFlowPlayerMedia
    /**
     * If true, automatic optical-flow-based speed adjustment is enabled
     */
    opticalFlowEnabled?: boolean,
    /**
     * Returns the mouse position, used to adjust the video playback speed.
     */
    getMousePosition: Function,
}

export class OpencvFlowPlayer extends CovfeeContinuousPlayer<Props, {}> {
    videoTag: HTMLVideoElement
    canvasTag: HTMLCanvasElement
    canvasCtx: CanvasRenderingContext2D

    cap: any // cv.VideoCapture
    frame_flow: any // cv.Mat
    myMean: any // cv.Mat
    myStddev: any // cv.Mat

    req_id: any = false
    rect: DOMRectReadOnly
    ratio: number = 0.5

    state = {
        ready: false
    }

    static defaultProps = {
        opticalFlowEnabled: true
    }

    componentDidMount() {

        const cv_init = () => {
            this.frame_flow = new cv.Mat(this.props.media.res[1], this.props.media.res[0]*2, cv.CV_8UC4)
            this.myMean = new cv.Mat(1, 4, cv.CV_64F)
            this.myStddev = new cv.Mat(1, 4, cv.CV_64F)
            this.cap = new cv.VideoCapture(this.videoTag)
            if(!this.props.paused) this.play()
        }

        // check if cv is already runtime-ready
        if (cv.Mat == undefined) {
            cv['onRuntimeInitialized'] = cv_init
        } else {
            cv_init()
        }
        
        this.canvasCtx = this.canvasTag.getContext('2d')

        // update the ratio of flow_res / video_res
        let observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
            this.rect = entries[0].contentRect
            this.ratio = this.props.media.res[0] / this.rect.width
        })
        observer.observe(this.canvasTag)

        // preload video and flow video
        fetch(urlReplacer(this.props.media.url))
            .then(response => response.blob())
            .then(blob=>{
                this.videoTag.src = window.URL.createObjectURL(blob)
            })
            .catch(err => {
                this.props.onError('There has been an error while loading the videos.', err)
            })

        this.videoTag.addEventListener('loadeddata', (e: Event) => {
            this.setState({ready: true})
            this.copyVideoToCanvas()
            this.props.onLoad(this.videoTag.duration, this.props.media.fps)
        })

        this.videoTag.addEventListener('ended', _=> {
            this.props.onEnd()
            this.pause()
        })
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.pause()
            else this.play()
        }
    }

    copyVideoToCanvas = () => {
        // copy the video content to the main canvas
        const width = this.canvasTag.width
        const height = this.canvasTag.height
        this.canvasCtx.drawImage(this.videoTag, 0, 0, this.props.media.res[0], this.props.media.res[1], 0, 0, width, height)
    }

    frameCallback = () => {
        const mouse_normalized = this.props.getMousePosition()

        const mouse = [
            mouse_normalized[0] * this.rect.width,
            mouse_normalized[0] * this.rect.height
        ]

        // start processing.
        this.cap.read(this.frame_flow)
        const x1 = Math.max(0, mouse[0] * this.ratio - 10)
        const x2 = Math.min(mouse[0] * this.ratio + 10, this.props.media.res[0])
        const y1 = Math.max(0, mouse[1] * this.ratio - 10)
        const y2 = Math.min(mouse[1] * this.ratio + 10, this.props.media.res[1])

        const rect = new cv.Rect(this.props.media.res[0] +x1, y1, x2-x1, y2-y1)
        const roi = this.frame_flow.roi(rect)
        cv.meanStdDev(roi, this.myMean, this.myStddev)
        const delay = this.myMean.doubleAt(0, 0)
        const rate = Math.min(1.0, Math.max(0.1, 1.0 / delay))

        if (!this.props.opticalFlowEnabled || mouse_normalized === undefined)
            this.videoTag.playbackRate = 1
        else {
            this.videoTag.playbackRate = rate
        }

        this.props.onFrame(this.videoTag.currentTime)
        this.req_id = (this.videoTag as any).requestVideoFrameCallback(this.frameCallback)
        this.copyVideoToCanvas()
    }

    play() {
        this.videoTag.play()
        this.req_id = (this.videoTag as any).requestVideoFrameCallback(this.frameCallback)
    }

    pause() {
        cancelAnimationFrame(this.req_id)
        this.req_id = false
    }

    restart() {
        this.currentTime(0)
    }

    currentTime = (time?: number, callback?: ()=>{}) => {
        if(time !== undefined) {
            this.videoTag.currentTime = time
            this.props.setPaused(true) // pause the video
            if(callback) return callback()
        }
        else return this.videoTag.currentTime
    }

    renderBar = () => {
        return <div className="annot-bar-right">
            <CaretRightOutlined /> 
            <Button size={'small'} type={'danger'}>{pr_str}</Button> <CloseOutlined /> 
            <Button size={'small'} type={this.state.opticalFlowEnabled ? 'danger' : 'dashed'}>
            {this.state.playbackBaseSpeed.toPrecision(2)} <Checkbox checked={this.state.opticalFlowEnabled} onChange={this.handleToggleOpticalFlow}></Checkbox>
            </Button>
        </div>
    }

    render() {
        return <>
            <canvas 
                ref={e=>{this.canvasTag = e}}
                style={{width: '100%'}}
                width={800}
                height={450}/>
            <video 
                ref={e=>{this.videoTag = e}}
                width={this.props.media.res[0]*2}
                height={this.props.media.res[1]}
                crossOrigin="Anonymous"
                style={{ display: 'none' }}
                preload="auto"
                disablePictureInPicture
                muted/>
        </>
    }
}

export default OpencvFlowPlayer