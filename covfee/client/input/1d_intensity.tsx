import * as React from 'react'
import { myerror } from '../utils'
import { BinaryInputSpec, ContinuousKeyboardInputSpec, GravityKeyboardInputSpec, Intensity1DInputSpec} from '@covfee-types/input/1d_intensity'

interface Props {
    /**
     * Called by the component to update the intensity reading. Should not call setState as it is called inside a requestAnimationFrame.
     */
    setIntensity: Function
    /*
     * Returns the value of the intensity reading.
     */
    getIntensity?: ()=>number
    /**
     * Indicates how the intensity is input
     */
    input: Intensity1DInputSpec
    /**
     * Turns on visualization where the UI is fully controlled by the parent.
     * The component will read its data via getIntensity()
     */
    visualizationModeOn?: boolean
    buttons: any
}


export class OneDIntensity extends React.Component<Props> {

    static defaultProps = {
    }
    inputProps: Intensity1DInputSpec

    // animation variables
    intensity: number = 0
    speed: number = 0

    animationId: number
    container: HTMLDivElement
    indicator: HTMLDivElement
    observer: ResizeObserver = null
    containerHeight: number = 0

    constructor(props: Props) {
        super(props)
        this.inputProps = this.applyInputPropDefaults()
    }

    componentDidMount() {
        // update the height of the container
        this.observer = new ResizeObserver((entries: any) => {
            this.containerHeight = entries[0].contentRect.height - 20
        })
        this.observer.observe(this.container)
        
        if(!this.props.visualizationModeOn)
            this.startInput()
        this.animationId = requestAnimationFrame(this.animate)
    }

    componentWillUnmount() {
        // this.props.buttons.removeEvents()
        document.removeEventListener('mousemove', this.mousemove, false)
        this.observer.disconnect()
        cancelAnimationFrame(this.animationId)
    }

    componentDidUpdate(prevProps: Props) {
        
        cancelAnimationFrame(this.animationId)
        this.inputProps = this.applyInputPropDefaults()
        this.setState(this.state, ()=>{
            this.animationId = requestAnimationFrame(this.animate)
        })
    }

    applyInputPropDefaults() {
        if (this.props.input.mode == 'binary')
            return {
                ...this.props.input,
                controls: {
                    up: 'a',
                    ...(this.props.input.controls ? this.props.input.controls : {})
                }
            }
        if(this.props.input.mode == 'gravity-keyboard')
            return {
                jump_speed: 0.1,
                acceleration_constant: 0.0025,
                ...this.props.input,
                controls: {
                    up: 'a',
                    ...(this.props.input.controls ? this.props.input.controls : {})
                }
            }
        if (this.props.input.mode == 'continuous-keyboard')
            return {
                ...this.props.input,
                controls: {
                    up: 's',
                    down: 'a',
                    ...(this.props.input.controls ? this.props.input.controls : {})
                }
            }
        return this.props.input
    }

    mousemove = (e: MouseEvent) => {
        const rect = this.container.getBoundingClientRect()
        const unboundedIntensity = (rect.bottom - e.clientY) / this.containerHeight
        this.intensity = Math.max(0.0, Math.min(1.0, unboundedIntensity))
    }

    addBinaryKeyboardEvents = () => {
        const controls = (this.inputProps as BinaryInputSpec).controls
        this.props.buttons.addListener('up', 'q', 'Activate')
        if (controls) this.props.buttons.applyMap(controls)
    }

    addContinuousKeyboardEvents = () => {
        this.props.buttons.addListener('up', 'ArrowUp', 'Increase')
            .addEvent('keydown', () => {
                this.intensity = Math.min(1.0, this.intensity + 0.05)
            })

        this.props.buttons.addListener('down', 'ArrowDown', 'Decrease')
            .addEvent('keydown', () => {
                this.intensity = Math.max(0, this.intensity - 0.05)
            })
            
        const controls = (this.inputProps as ContinuousKeyboardInputSpec).controls
        if (controls) this.props.buttons.applyMap(controls)
    }

    addGravityKeyboardEvents = () => {
        this.props.buttons.addListener('up', 'a', 'Increase')
            .addEvent('keydown', () => {
                this.intensity = 1
                this.speed = 0//this.props.input.jump_speed
            })
        
        const controls = (this.inputProps as GravityKeyboardInputSpec).controls
        if (controls) this.props.buttons.applyMap(controls)
    }

    startInput = () => {
        if (this.inputProps.mode == 'binary') {
            this.addBinaryKeyboardEvents()
        } else if (this.inputProps.mode == 'continuous-mousemove') {
            document.addEventListener('mousemove', this.mousemove, false)
        } else if (this.inputProps.mode == 'continuous-keyboard') {
            this.addContinuousKeyboardEvents()
        } else if (this.inputProps.mode == 'gravity-keyboard') {
            this.addGravityKeyboardEvents()
        } else {
            myerror('Unrecognized input mode.')
        }        
    }

    read = () => {
        return this.intensity
    }

    updateIndicators = (intensity: number) => {
        if(this.container === null || this.indicator === null) return
         
        if (['binary'].includes(this.inputProps.mode)) {
            // mode uses no indicator
            this.container.style.backgroundColor = intensity ? 'green' : 'black'
        } else {
            // move the indicator
            const position = Math.round(intensity * this.containerHeight)
            this.indicator.style.bottom = position.toString() + 'px'
        }
    }

    
    animate = (timestamp: number) => {
        if(this.props.visualizationModeOn) {
            this.intensity = this.props.getIntensity()
        } else {
            if (this.inputProps.mode == 'binary') 
                this.intensity = this.props.buttons.getStatus('up') ? 1 : 0
            if (this.inputProps.mode == 'continuous-mousemove')
                { } //pass  
            if (this.inputProps.mode == 'continuous-keyboard')
                { } //pass
            if (this.inputProps.mode == 'gravity-keyboard') {
                let delta_time = 1
                // TODO: implement delta_time calculation
                this.intensity = Math.max(0, Math.min(1, this.intensity + this.speed * delta_time))
                this.speed = this.speed - this.inputProps.acceleration_constant * delta_time
            }
            this.props.setIntensity(this.intensity)
        }

        this.updateIndicators(this.intensity)
        this.animationId = requestAnimationFrame(this.animate)
    }

    render() {
        return <div ref={e=>{this.container = e}} className='gui-vertical'>
            {!['binary'].includes(this.inputProps.mode) &&
            <div ref={e=>{this.indicator = e}} className='gui-indicator' style={{bottom: 0}}></div>
            }
        </div>
    }
}
