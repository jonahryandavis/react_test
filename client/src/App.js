import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import "./App.css"
import socket from "./socket"

const ROOM_TYPE = {
  PVP: "PvP",
  PVAI: "PvAI",
  AIVAI: "AIvAI",
}

const ROOM_STATUS = {
  LOADING: "loading",
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
  ERROR: "error",
}

const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
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

function Lobby() {
  const navigate = useNavigate()
  const [isWaiting, setIsWaiting] = useState(false)
  const [selectedAIMode, setSelectedAIMode] = useState(null)

  useEffect(() => {
    const handleGameStart = (data) => {
      navigate(`/${data.roomId}`)
    }

    const handleWaiting = () => {
      setIsWaiting(true)
    }

    const handleGameError = (data) => {
      alert(data.message)
      navigate("/")
    }

    socket.on("game_start", handleGameStart)
    socket.on("waiting_for_opponent", handleWaiting)
    socket.on("game_error", handleGameError)

    return () => {
      socket.off("game_start", handleGameStart)
      socket.off("waiting_for_opponent", handleWaiting)
      socket.off("game_error", handleGameError)
    }
  }, [navigate])

  const requestGame = (mode, difficulty) => {
    if (isWaiting && mode === ROOM_TYPE.PVP) {
      socket.emit("leave_waiting")
      setIsWaiting(false)
      return
    }
    socket.emit("request_game", { mode, difficulty })
  }

  const selectAI = (mode) => {
    setSelectedAIMode(mode)
  }

  const selectDifficulty = (difficulty) => {
    requestGame(selectedAIMode, difficulty)
  }

  return (
    <div className="lobby">
      <h1>Side Stacker</h1>
      <button
        onClick={() => requestGame(ROOM_TYPE.PVP)}
        disabled={selectedAIMode}
      >
        {isWaiting ? "Waiting for opponent..." : "PvP"}
      </button>
      {selectedAIMode === ROOM_TYPE.PVAI ? (
        <div className="difficulty-selector">
          <button
            onClick={() => selectDifficulty(DIFFICULTY.EASY)}
            className="difficulty-easy"
          >
            E
          </button>
          <button
            onClick={() => selectDifficulty(DIFFICULTY.MEDIUM)}
            className="difficulty-medium"
          >
            M
          </button>
          <button
            onClick={() => selectDifficulty(DIFFICULTY.HARD)}
            className="difficulty-hard"
          >
            H
          </button>
        </div>
      ) : (
        <button
          onClick={() => selectAI(ROOM_TYPE.PVAI)}
          disabled={isWaiting || selectedAIMode}
        >
          PvAI
        </button>
      )}
      {selectedAIMode === ROOM_TYPE.AIVAI ? (
        <div className="difficulty-selector">
          <button
            onClick={() => selectDifficulty(DIFFICULTY.EASY)}
            className="difficulty-easy"
          >
            E
          </button>
          <button
            onClick={() => selectDifficulty(DIFFICULTY.MEDIUM)}
            className="difficulty-medium"
          >
            M
          </button>
          <button
            onClick={() => selectDifficulty(DIFFICULTY.HARD)}
            className="difficulty-hard"
          >
            H
          </button>
        </div>
      ) : (
        <button
          onClick={() => selectAI(ROOM_TYPE.AIVAI)}
          disabled={isWaiting || selectedAIMode}
        >
          AIvAI
        </button>
      )}
    </div>
  )
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

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/:roomId" element={<GameRoom />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
