import classNames from "classnames"
import * as React from "react"

export type AllPropsRequired<Object> = {
  [Property in keyof Object]-?: Object[Property]
}

export class CodeBlock extends React.Component {
  render() {
    return (
      <>
        <div>
          <pre className={classNames("docs-code-block")}>
            {JSON.stringify(this.props.code, null, 2)}
          </pre>
        </div>
      </>
    )
  }
}

export class LivePreviewFrame extends React.Component {
  render() {
    return (
      <>
        <div style={{ border: "1px solid #c8c8c8", overflow: "hidden" }}>
          <div
            style={{
              backgroundColor: "#d8d8d8",
              padding: "3px 5px",
              textAlign: "center",
              color: "#555555",
            }}
          >
            LIVE PREVIEW: data is not being collected
          </div>
          {this.props.children}
        </div>
      </>
    )
  }
}

export function arrayUnique(array) {
  var a = array.concat()
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1)
    }
  }

  return a
}
