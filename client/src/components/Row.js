import React from "react"
import Cell from "./Cell"
import { SIDE } from "react-test-shared"

function Row({
  row,
  rIndex,
  moves,
  winningCells,
  latestCell,
  currentPlayer,
  myToken,
  status,
  makeMove,
}) {
  return (
    <div className="row">
      <button
        className={
          "button-row-left " + (currentPlayer === myToken ? myToken : "")
        }
        disabled={
          status !== "playing" ||
          currentPlayer !== myToken ||
          !moves.some((m) => m.row === rIndex && m.side === SIDE.LEFT)
        }
        onClick={() => makeMove(rIndex, SIDE.LEFT)}
      ></button>
      {row.map((cell, cIndex) => {
        const animationDirection =
          latestCell.row === rIndex
            ? latestCell.column === cIndex
              ? latestCell.side
              : null
            : null
        const animationClass =
          animationDirection === SIDE.LEFT
            ? "animate-from-left"
            : animationDirection === SIDE.RIGHT
            ? "animate-from-right"
            : ""
        const isWinning = winningCells.some(
          (m) => m.row === rIndex && m.column === cIndex
        )
        return (
          <Cell
            key={cIndex}
            cell={cell}
            isWinning={isWinning}
            animationClass={animationClass}
          />
        )
      })}
      <button
        className={
          "button-row-right " + (currentPlayer === myToken ? myToken : "")
        }
        disabled={
          status !== "playing" ||
          currentPlayer !== myToken ||
          !moves.some((m) => m.row === rIndex && m.side === SIDE.RIGHT)
        }
        onClick={() => makeMove(rIndex, SIDE.RIGHT)}
      ></button>
    </div>
  )
}

export default Row
