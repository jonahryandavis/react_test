const { Board } = require("./board")
const db = require("./db")

const ROOM_TYPE = {
  PVP: "PvP",
  PVAI: "PvAI",
  AIVAI: "AIvAI",
}

const ROOM_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
}

const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
}

class Room {
  constructor(id, type, difficulty = DIFFICULTY.EASY) {
    this.id = id
    this.type = type // ROOM_TYPE
    this.board = new Board()
    this.players = []
    this.difficulty = difficulty
    this.status = ROOM_STATUS.WAITING

    // Insert room into DB
    db.insertRoom(this)
  }

  addPlayer(player) {
    if (this.players.length >= 2) return false
    this.players.push(player)

    // Insert player into DB
    db.insertPlayer(player)

    // Update room with player_x/player_o if available
    const playerX = this.players[0]?.player_id || null
    const playerO = this.players[1]?.player_id || null
    db.updateRoomPlayers(this.id, playerX, playerO)

    if (
      (this.type === ROOM_TYPE.PVP && this.players.length === 2) ||
      (this.type === ROOM_TYPE.PVAI && this.players.length === 2) ||
      (this.type === ROOM_TYPE.AIVAI && this.players.length === 2)
    ) {
      this.status = ROOM_STATUS.PLAYING
      db.updateRoomStatus(this.id, this.status)
    }

    return true
  }

  isFull() {
    return this.players.length === 2
  }

  handleMove(playerToken, row, side) {
    if (this.status !== ROOM_STATUS.PLAYING) return false
    if (this.board.currentPlayer !== playerToken) return false

    const success = this.board.makeMove(row, side)
    if (success) {
      // Write move to DB
      db.insertMove({
        room_id: this.id,
        player_id: playerToken,
        row,
        side,
      })

      // Update board state in DB
      db.updateBoardState({
        room_id: this.id,
        grid_state: JSON.stringify(this.board.grid),
        current_player_id: this.board.currentPlayer,
        winner: this.board.winner || null,
        game_over: this.board.gameOver,
      })

      if (this.board.gameOver) {
        this.status = ROOM_STATUS.FINISHED
        db.updateRoomStatus(this.id, this.status)
      }
    }
    return success
  }

  getGameState() {
    return {
      roomId: this.id,
      type: this.type,
      status: this.status,
      players: this.players.map((p) => ({ id: p.player_id, token: p.token })),
      board: this.board.getBoardState(),
      difficulty: this.difficulty,
    }
  }
}

module.exports = { Room, ROOM_TYPE, ROOM_STATUS, DIFFICULTY }
