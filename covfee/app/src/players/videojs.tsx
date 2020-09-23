import React from 'react'
import videojs from 'video.js'

// video.js player from the docs: https://github.com/videojs/video.js/blob/master/docs/guides/react.md
class VideojsPlayer extends React.PureComponent {
    private player: any;

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
            this.play()
        });

        if (this.props.onPlay) {
            this.player.on('play', (e) => {
                this.props.onPlay(e)
            })
        }

        if (this.props.onPause) {
            this.player.on('pause', (e) => {
                this.props.onPause(e)
            })
        }

        if (this.props.onEnded) {
            this.player.on('ended', (e) => {
                this.props.onEnded(e)
            })
        }
    }

    public play() {
        this.player.play()
    }

    public playbackRate(rate: number) {
        this.player.playbackRate(rate)
    }

    public toggle_play_pause() {
        if (this.player.paused()) {
            this.player.play()
        } else {
            this.player.pause()
        }
    }

    public currentTime(t: number) {
        return this.player.currentTime(t)
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    componentWillReceiveProps(newProps) {
        // When a user moves from one title to the next, the VideoPlayer component will not be unmounted,
        // instead its properties will be updated with the details of the new video. In this case,
        // we can update the src of the existing player with the new video URL.
        // if (this.player) {
        //     this.player.src(newProps.sources[0])
        // }
    }

    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856

    // use `ref` to give Video JS a reference to the video DOM element: https://reactjs.org/docs/refs-and-the-dom
    render() {
        console.log('render')
        return (
            <div data-vjs-player>
                <video ref={node => this.videoNode = node} className="video-js"></video>
            </div>
        )
    }
}

export default VideojsPlayer