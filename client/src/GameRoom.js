import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import socket from "./socket"

const ROOM_STATUS = {
  LOADING: "loading",
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
  ERROR: "error",
}

const PLAYER = {
  X: "X",
  O: "O",
  SPECTATOR: "Spectator",
}

const SIDE = {
  LEFT: "L",
  RIGHT: "R",
}

function GameRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [board, setBoard] = useState(
    Array(7)
      .fill(null)
      .map(() => Array(7).fill(null))
  )
  const [moves, setMoves] = useState([])
  const [winningCells, setWinningCells] = useState([])
  const [latestCell, setLatestCell] = useState(null)
  const [myToken, setMyToken] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [winner, setWinner] = useState(null)
  const [loser, setLoser] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [status, setStatus] = useState(ROOM_STATUS.LOADING)
  const hasJoined = useRef(false)

  useEffect(() => {
    if (!hasJoined.current) {
      socket.emit("join_room", { roomId })
      hasJoined.current = true
    }

    socket.on("game_start", (data) => {
      setStatus(ROOM_STATUS.PLAYING)
      setBoard(data.board.grid)
      setMoves(data.board.moves)
      setWinningCells(data.board.winningCells)
      setLatestCell(data.board.latestCell)
      setCurrentPlayer(data.board.currentPlayer)
      setDifficulty(data.difficulty)

      const me = data.players.find((p) => p.id === socket.id)
      if (me) {
        setMyToken(me.token)
      } else {
        setMyToken(PLAYER.SPECTATOR)
      }
    })

    socket.on("game_update", (data) => {
      setBoard(data.board.grid)
      setMoves(data.board.moves)
      setWinningCells(data.board.winningCells)
      setLatestCell(data.board.latestCell)
      setCurrentPlayer(data.board.currentPlayer)
      setDifficulty(data.difficulty)
      if (data.status === ROOM_STATUS.FINISHED) {
        setStatus(ROOM_STATUS.FINISHED)
        setWinner(data.board.winner)
        setLoser(data.board.winner === PLAYER.X ? PLAYER.O : PLAYER.X)
      }
    })

    socket.on("game_error", (data) => {
      setStatus(ROOM_STATUS.ERROR)
      alert(data.message)
      navigate("/")
    })

    return () => {
      socket.off("game_start")
      socket.off("game_update")
      socket.off("game_error")
    }
  }, [roomId, navigate])

  const makeMove = (row, side) => {
    if (status !== ROOM_STATUS.PLAYING) return
    if (currentPlayer !== myToken) return
    socket.emit("make_move", { roomId, row, side })
  }

  if (status === ROOM_STATUS.LOADING) return <div>Loading Room...</div>
  if (status === ROOM_STATUS.ERROR) return <div>Error joining room.</div>

  const isSpectator = myToken === PLAYER.SPECTATOR
  const isFinished = status === ROOM_STATUS.FINISHED
  const showEmphasizedBack = isSpectator || isFinished

  return (
    <div className="room">
      <div className="navigation">
        <button
          className={showEmphasizedBack ? "button-primary" : "button-outline"}
          onClick={() => {
            socket.emit("leave_room", { roomId })
            navigate("/")
          }}
        >
          Back to Lobby
        </button>
        <h4>Room: {roomId}</h4>
        <h4>You are: {myToken}</h4>
        <h4>Difficulty: {difficulty}</h4>
      </div>
      <div className="game-board">
        {status === ROOM_STATUS.PLAYING && (
          <h2>Current Turn: {currentPlayer}</h2>
        )}
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
            <div key={rIndex} className="row">
              <button
                className={
                  "button-row-left " +
                  (currentPlayer === myToken ? myToken : "")
                }
                disabled={
                  status !== ROOM_STATUS.PLAYING ||
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
                return (
                  <div
                    key={cIndex}
                    className={`cell ${cell} ${
                      winningCells.some(
                        (m) => m.row === rIndex && m.column === cIndex
                      )
                        ? "winning"
                        : ""
                    } ${animationClass}`}
                  >
                    {cell}
                  </div>
                )
              })}
              <button
                className={
                  "button-row-right " +
                  (currentPlayer === myToken ? myToken : "")
                }
                disabled={
                  status !== ROOM_STATUS.PLAYING ||
                  currentPlayer !== myToken ||
                  !moves.some((m) => m.row === rIndex && m.side === SIDE.RIGHT)
                }
                onClick={() => makeMove(rIndex, SIDE.RIGHT)}
              ></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GameRoom
