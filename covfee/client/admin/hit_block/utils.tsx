import { styled } from "styled-components"
import { NodeType } from "../../types/node"
import { NodeButtons } from "./node_buttons"
import React from "react"

export const ButtonsContainer = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  /* Never let the button strip wrap or be squeezed by a long node name. */
  white-space: nowrap;

  > li {
    display: inline-block;
    margin: 0 0.2em;

    button {
      cursor: pointer;
    }
  }
`

export type HoveringButtonsArgs = {
  x: number
  y: number
  hide: boolean
}

export type HoveringButtonsProps = HoveringButtonsArgs & {
  onFocus: () => void
  onBlur: () => void
  content: () => React.ReactNode
}

export const HoveringButtons = ({
  x,
  y,
  hide = false,
  onFocus = () => {},
  onBlur = () => {},
  content = () => <></>,
}: HoveringButtonsProps) => {
  if (!hide)
    return (
      <div
        style={{
          zIndex: 100,
          position: "fixed",
          top: y,
          left: x,
          backgroundColor: "#ddd",
          borderRadius: "5px",
          padding: "3px",
        }}
        onMouseEnter={onFocus}
        onMouseLeave={onBlur}
      >
        {(() => {
          return content()
        })()}
      </div>
    )
}

export const Row = styled.div.attrs((p) => ({ className: p.className }))`
  margin: 0;
  padding: 5px 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;

  &.danger {
    /* background-color: red; */
    background: repeating-linear-gradient(
      45deg,
      #ffeeee,
      #ffeeee 10px,
      white 10px,
      white 20px
    );
  }

  &.focus {
    background-color: rgba(94, 78, 78, 0.05);
  }

  /* Everything but the name keeps its natural size... */
  > * {
    flex: 0 0 auto;
  }

  /* ...and the name takes the rest. It used to be pinned to a 150-200px box
     while being unable to shrink, so a long node name simply rendered past its
     box and ran underneath the buttons. min-width: 0 lets it shrink, and
     overflow-wrap breaks the underscore-joined names, which have no natural
     break opportunities. The max-width stops the name from growing the full
     width of a wide window, which would strand the buttons far off to the
     right; the names are all a similar length, so they all reach the cap and
     the buttons stay in a tidy column. */
  > a {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 36em;
    overflow-wrap: anywhere;
  }
`
