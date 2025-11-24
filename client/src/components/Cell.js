import React from "react"

function Cell({ cell, isWinning, animationClass }) {
  return (
    <div
      className={`cell ${cell} ${isWinning ? "winning" : ""} ${animationClass}`}
    >
      {cell}
    </div>
  )
}

export default Cell
