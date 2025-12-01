import React from "react"
import Row from "./Row"
import {ROOM_STATUS} from "react-test-shared"

function GameBoard({
  board,
  moves,
  winningCells,
  latestCell,
  currentPlayer,
  myToken,
  status,
  makeMove,
  winner,
  loser,
  difficulty,
}) {
  return (
    <div className="game-board">
      {status === ROOM_STATUS.PLAYING && <h2>Current Turn: {currentPlayer}</h2>}
      {status === ROOM_STATUS.FINISHED && (
        <h1>
          {winner} won! {loser} lost.
        </h1>
      )}
      <div
        className={
          "grid" +
          (currentPlayer === myToken ? " currentTurn " + currentPlayer : "")
        }
      >
        {board.map((row, rIndex) => (
          <Row
            key={rIndex}
            row={row}
            rIndex={rIndex}
            moves={moves}
            winningCells={winningCells}
            latestCell={latestCell}
            currentPlayer={currentPlayer}
            myToken={myToken}
            status={status}
            makeMove={makeMove}
          />
        ))}
      </div>
    </div>
  )
}

export default GameBoard
