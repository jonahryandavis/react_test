const sqlite3 = require("sqlite3").verbose()
const path = require("path")

class GameDatabase {
  constructor() {
    const dbPath = path.join(__dirname, "game.db")
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Could not connect to database", err)
      } else {
        console.log("Connected to SQLite database")
      }
    })

    this.db.serialize(() => {
      // Rooms table
      this.db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        created_at TEXT,
        type TEXT,
        status TEXT,
        player_x TEXT,
        player_o TEXT,
        difficulty TEXT
      )`)

      // Players table
      this.db.run(`CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        is_ai INTEGER,
        label TEXT
      )`)

      // Moves table
      this.db.run(`CREATE TABLE IF NOT EXISTS moves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT,
        player_id TEXT,
        row INTEGER,
        side TEXT,
        FOREIGN KEY(room_id) REFERENCES rooms(id),
        FOREIGN KEY(player_id) REFERENCES players(id)
      )`)

      // Boards table
      this.db.run(`CREATE TABLE IF NOT EXISTS boards (
        room_id TEXT PRIMARY KEY,
        grid_state TEXT,
        current_player_id TEXT,
        winner TEXT,
        game_over INTEGER,
        FOREIGN KEY(room_id) REFERENCES rooms(id)
      )`)
    })
  }

  insertRoom(room) {
    this.db.run(
      `INSERT OR IGNORE INTO rooms (id, created_at, type, status, difficulty) VALUES (?, datetime('now'), ?, ?, ?)`,
      [room.id, room.type, room.status, room.difficulty]
    )
  }

  updateRoomPlayers(roomId, playerX, playerO) {
    this.db.run(`UPDATE rooms SET player_x = ?, player_o = ? WHERE id = ?`, [
      playerX,
      playerO,
      roomId,
    ])
  }

  updateRoomStatus(roomId, status) {
    this.db.run(`UPDATE rooms SET status = ? WHERE id = ?`, [status, roomId])
  }

  insertPlayer(player) {
    this.db.run(
      `INSERT OR IGNORE INTO players (id, is_ai, label) VALUES (?, ?, ?)`,
      [player.player_id, player.is_ai ? 1 : 0, player.token]
    )
  }

  insertMove(move) {
    this.db.run(
      `INSERT INTO moves (room_id, player_id, row, side) VALUES (?, ?, ?, ?)`,
      [move.room_id, move.player_id, move.row, move.side]
    )
  }

  updateBoardState(board) {
    this.db.run(
      `INSERT OR REPLACE INTO boards (room_id, grid_state, current_player_id, winner, game_over) VALUES (?, ?, ?, ?, ?)`,
      [
        board.room_id,
        board.grid_state,
        board.current_player_id,
        board.winner,
        board.game_over ? 1 : 0,
      ]
    )
  }

  getRoomState(roomId) {
    const db = this.db
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM rooms WHERE id = ?`, [roomId], (err, room) => {
        if (err || !room) return reject(err || new Error("Room not found"))
        db.all(
          `SELECT * FROM players WHERE id IN (?, ?)`,
          [room.player_x, room.player_o],
          (err, players) => {
            if (err) return reject(err)
            db.get(
              `SELECT * FROM boards WHERE room_id = ?`,
              [roomId],
              (err, board) => {
                if (err) return reject(err)
                db.all(
                  `SELECT * FROM moves WHERE room_id = ? ORDER BY id ASC`,
                  [roomId],
                  (err, moves) => {
                    if (err) return reject(err)
                    resolve({ room, players, board, moves })
                  }
                )
              }
            )
          }
        )
      })
    })
  }

  getMoveHistory(roomId) {
    const db = this.db
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM moves WHERE room_id = ? ORDER BY id ASC`,
        [roomId],
        (err, moves) => {
          if (err) return reject(err)
          resolve(moves)
        }
      )
    })
  }
}

const db = new GameDatabase()
module.exports = db
