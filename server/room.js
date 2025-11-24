const { Board, PLAYER } = require("./board")

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
  }

  addPlayer(player) {
    if (this.players.length >= 2) return false
    this.players.push(player)

    if (this.type === ROOM_TYPE.PVP && this.players.length === 2) {
      this.status = ROOM_STATUS.PLAYING
    } else if (this.type === ROOM_TYPE.PVAI && this.players.length === 2) {
      this.status = ROOM_STATUS.PLAYING
    } else if (this.type === ROOM_TYPE.AIVAI && this.players.length === 2) {
      this.status = ROOM_STATUS.PLAYING
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
      if (this.board.gameOver) {
        this.status = ROOM_STATUS.FINISHED
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

  getDifficulty() {
    return this.difficulty
  }
}

module.exports = { Room, ROOM_TYPE, ROOM_STATUS }
