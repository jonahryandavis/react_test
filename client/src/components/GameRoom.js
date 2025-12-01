import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import socket from "../socket"
import Navigation from "./Navigation"
import GameBoard from "./GameBoard"
import { ROOM_STATUS, PLAYER } from "react-test-shared"

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
  const [roomType, setRoomType] = useState(null)
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
      setRoomType(data.type)

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
      <Navigation
        roomId={roomId}
        myToken={myToken}
        roomType={roomType}
        difficulty={difficulty}
        showEmphasizedBack={showEmphasizedBack}
        onBack={() => {
          socket.emit("leave_room", { roomId })
          navigate("/")
        }}
      />
      <GameBoard
        board={board}
        moves={moves}
        winningCells={winningCells}
        latestCell={latestCell}
        currentPlayer={currentPlayer}
        myToken={myToken}
        status={status}
        makeMove={makeMove}
        winner={winner}
        loser={loser}
        difficulty={difficulty}
      />
    </div>
  )
}

export default GameRoom
