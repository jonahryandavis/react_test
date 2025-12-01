const express = require("express")
const app = express()
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const PORT = process.env.PORT || 3001

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

const { v4: uuidv4 } = require("uuid")
const { Room, ROOM_TYPE, ROOM_STATUS, DIFFICULTY } = require("./room")
const Player = require("./player")
const { PLAYER } = require("./board")
const AI = require("./ai/ai")

// State
const rooms = new Map() // roomId -> Room
let waitingPlayer = null // Socket for PvP matchmaking

function startPvP(socket) {
  if (!waitingPlayer || !socket) return

  // Match found!
  const roomId = uuidv4()
  const room = new Room(roomId, ROOM_TYPE.PVP)

  const p1 = new Player(roomId, waitingPlayer.id, PLAYER.X)
  const p2 = new Player(roomId, socket.id, PLAYER.O)

  room.addPlayer(p1)
  room.addPlayer(p2)

  rooms.set(roomId, room)

  // Notify players
  waitingPlayer.join(roomId)
  socket.join(roomId)

  io.to(roomId).emit("game_start", room.getGameState())

  waitingPlayer = null
}

function startPvAI(socket, difficulty) {
  const roomId = uuidv4()
  const room = new Room(roomId, ROOM_TYPE.PVAI, difficulty)

  const p1 = new Player(roomId, socket.id, PLAYER.X)
  const ai = new Player(roomId, "AI_AGENT", PLAYER.O)

  room.addPlayer(p1)
  room.addPlayer(ai)

  rooms.set(roomId, room)
  socket.join(roomId)

  socket.emit("game_start", room.getGameState())

  // Trigger AI move if AI goes first (X is human, O is AI)
  const delay = getDelay(ROOM_TYPE.PVAI, difficulty, room.status)
  AI.scheduleAIMove(room, io, delay)
}

function startAIVAI(socket, difficulty) {
  const roomId = uuidv4()
  const room = new Room(roomId, ROOM_TYPE.AIVAI, difficulty)

  const ai1 = new Player(roomId, "AI_AGENT_1", PLAYER.X)
  const ai2 = new Player(roomId, "AI_AGENT_2", PLAYER.O)

  room.addPlayer(ai1)
  room.addPlayer(ai2)

  rooms.set(roomId, room)
  socket.join(roomId)

  socket.emit("game_start", room.getGameState())

  // Trigger AI move (both players are AI, X goes first)
  const delay = getDelay(ROOM_TYPE.AIVAI, difficulty, room.status)
  AI.scheduleAIMove(room, io, delay)
}

function getDelay(mode, difficulty, status) {
  if (status == ROOM_STATUS.REPLAYING) {
    return 500 // Faster delay during replay
  }
  let delay = 1000 // Fast response feels good
  if (difficulty === DIFFICULTY.HARD) {
    // We need to limit delay on hard to stay within LLM rate limits
    if (mode === ROOM_TYPE.PVAI) {
      delay = 2000
    } else if (mode === ROOM_TYPE.AIVAI) {
      delay = 4000
    }
  } else if (mode === ROOM_TYPE.AIVAI) {
    // When AI is playing itself, a little more delay looks better
    delay = 2000
  }
  return delay
}

function handleWaitingDisconnect(socket) {
  if (waitingPlayer && waitingPlayer.id === socket.id) {
    console.log(`User ${socket.id} left waiting queue`)
    waitingPlayer = null
  }
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  socket.on("request_game", ({ mode, difficulty }) => {
    console.log(
      `User ${socket.id} requesting ${mode}` +
        (difficulty ? ` with difficulty ${difficulty}` : "")
    )

    if (mode === ROOM_TYPE.PVP) {
      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        startPvP(socket)
      } else {
        // Wait for opponent
        waitingPlayer = socket
        socket.emit("waiting_for_opponent")
      }
    } else if (mode === ROOM_TYPE.PVAI) {
      startPvAI(socket, difficulty)
    } else if (mode === ROOM_TYPE.AIVAI) {
      startAIVAI(socket, difficulty)
    }
  })

  socket.on("join_room", async ({ roomId }) => {
    console.log(`User ${socket.id} joining room ${roomId}`)
    let room = rooms.get(roomId)

    if (room) {
      // Check if already in room?
      const existingPlayer = room.players.find((p) => p.player_id === socket.id)
      if (existingPlayer) {
        socket.join(roomId)
        socket.emit("game_start", room.getGameState())
        return
      }

      const takenTokens = room.players.map((p) => p.token)
      let token = PLAYER.X
      if (takenTokens.includes(PLAYER.X)) token = PLAYER.O

      const player = new Player(roomId, socket.id, token)
      room.addPlayer(player)

      socket.join(roomId)
      io.to(roomId).emit("game_start", room.getGameState())

      if (room.isFull() && room.type === ROOM_TYPE.PVP) {
        io.to(roomId).emit("game_update", room.getGameState())
      }
    } else {
      // Try to load from DB for spectators
      const db = require("./db")
      try {
        const {
          room: dbRoom,
          players,
          board,
          moves,
        } = await db.getRoomState(roomId)
        if (!dbRoom) {
          socket.emit("game_error", { message: "Room not found" })
          return
        }
        // Reconstruct Room instance
        const { Room } = require("./room")
        const reconstructedRoom = new Room(
          dbRoom.id,
          dbRoom.type,
          dbRoom.difficulty
        )
        reconstructedRoom.status = dbRoom.status
        // Add players
        players.forEach((p) => {
          reconstructedRoom.players.push({
            player_id: p.id,
            is_ai: !!p.is_ai,
            token: p.label,
          })
        })
        // Restore board state
        if (board) {
          reconstructedRoom.board.grid = JSON.parse(board.grid_state)
          reconstructedRoom.board.currentPlayer = board.current_player_id
          reconstructedRoom.board.winner = board.winner
          reconstructedRoom.board.gameOver = !!board.game_over
        }
        rooms.set(roomId, reconstructedRoom)
        socket.join(roomId)
        socket.emit("game_start", reconstructedRoom.getGameState())
      } catch (err) {
        socket.emit("game_error", { message: "Room not found" })
      }
    }
  })

  socket.on("leave_room", ({ roomId }) => {
    console.log(`User ${socket.id} leaving room ${roomId}`)
    const room = rooms.get(roomId)

    if (room) {
      socket.leave(roomId)
    }
  })

  socket.on("make_move", ({ roomId, row, side }) => {
    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.find((p) => p.player_id === socket.id)
    if (!player) return // Spectator or invalid

    const success = room.handleMove(player.token, row, side)
    if (success) {
      io.to(roomId).emit("game_update", room.getGameState())

      // Check if next player is AI and trigger their move
      if (room.status === ROOM_STATUS.PLAYING) {
        const delay = getDelay(room.mode, room.difficulty, room.status)
        AI.scheduleAIMove(room, io, delay)
      }
    }
  })

  function handleReplayMove(room, moveHistory, currentMoveIndex) {
    if (currentMoveIndex > moveHistory.length) {
      socket.emit("game_error", { message: "Invalid move history for room." })
      return
    }
    const move = moveHistory[currentMoveIndex]

    if (!room.handleMove(move.player_id, move.row, move.side)) {
      socket.emit("game_error", { message: "Invalid move history for room." })
      return
    }
    io.to(room.id).emit("game_update", room.getGameState())

    if (room.isGameOver()) return

    const delay = getDelay(room.mode, room.difficulty, room.status)
    setTimeout(() => {
      handleReplayMove(room, moveHistory, currentMoveIndex + 1)
    }, delay)
  }

  socket.on("replay_game", ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return

    if (room.status !== ROOM_STATUS.FINISHED) return

    room.board.reset()
    room.status = ROOM_STATUS.REPLAYING
    io.to(room.id).emit("game_update", room.getGameState())

    moveHistory = room.getMoveHistory().then((moves) => {
      handleReplayMove(room, moves, 0)
    })
  })

  socket.on("leave_waiting", () => {
    handleWaitingDisconnect(socket)
  })

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)
    handleWaitingDisconnect(socket)
  })
})

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
