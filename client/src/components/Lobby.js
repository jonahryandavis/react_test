import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import socket from "../socket"

const ROOM_TYPE = {
  PVP: "PvP",
  PVAI: "PvAI",
  AIVAI: "AIvAI",
}

const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
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

export default Lobby
