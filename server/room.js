const { Board } = require("./board")
const db = require("./db")
const { ROOM_TYPE, ROOM_STATUS, DIFFICULTY } = require('../shared/enums.js')


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

    if (isFull()) {
      this.status = ROOM_STATUS.PLAYING
      db.updateRoomStatus(this.id, this.status)
    }

    return true
  }

  isFull() {
    return this.players.length === 2
  }

  isGameOver() {
    return this.board.gameOver
  }

  handleMove(playerToken, row, side) {
    if (this.status !== ROOM_STATUS.PLAYING) return false
    if (this.board.currentPlayer !== playerToken) return false

    if (this.board.makeMove(row, side)) {
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

      if (isGameOver()) {
        this.status = ROOM_STATUS.FINISHED
        db.updateRoomStatus(this.id, this.status)
      }
      return true
    }
    return false
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
