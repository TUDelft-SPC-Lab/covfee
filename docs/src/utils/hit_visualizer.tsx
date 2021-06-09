import * as React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

export interface HITVisualizerProps {
    hit: HITSpec
}

export interface HITVisualizerState {
}

export class HITVisualizer extends React.Component<HITVisualizerProps, HITVisualizerState> {

    state: HITVisualizerState = {
    }

    constructor(props: HITVisualizerProps) {
        super(props)
    }

    render() {
        // add id to each task
        let hitProps = JSON.parse(JSON.stringify(this.props.hit))
        hitProps.tasks = hitProps.tasks.map((task, idx) => {
            task.id = idx
            return task
        })
        return <BrowserOnly fallback={<div>The fallback content to display on prerendering</div>}>
            {()=>{
                const HashRouter = require('react-router-dom').HashRouter
                const Hit = require('covfee-client/hit/hit').default

                return <HashRouter><div style={{ minHeight: '300px', 'border': '1px solid #969696' }}>
                        <Hit
                            {...hitProps}
                            routingEnabled={false}
                            url={null}
                            previewMode={true}
                            onSubmit={() => { }} />
                </div></HashRouter>
            }}
        </BrowserOnly>
    }
}