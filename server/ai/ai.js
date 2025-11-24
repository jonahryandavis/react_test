const aiEasy = require("./ai_easy")
const aiMedium = require("./ai_medium")
const aiHard = require("./ai_hard")

const { DIFFICULTY, ROOM_STATUS } = require("../room")

function isAIPlayer(playerId) {
  return playerId && playerId.startsWith("AI_AGENT")
}

async function selectMove(board, difficulty = DIFFICULTY.EASY) {
  // Delegate to the appropriate AI module based on difficulty
  switch (difficulty) {
    case DIFFICULTY.EASY:
      return aiEasy.selectMove(board)
    case DIFFICULTY.MEDIUM:
      return aiMedium.selectMove(board)
    case DIFFICULTY.HARD:
      return aiHard.selectMove(board)
    default:
      return aiEasy.selectMove(board)
  }
}

function scheduleAIMove(room, io, delay = 2000) {
  // Don't schedule if game is over
  if (room.status !== ROOM_STATUS.PLAYING) {
    return
  }

  // Check if current player is AI
  const currentPlayerObj = room.players.find(
    (p) => p.token === room.board.currentPlayer
  )

  if (!currentPlayerObj || !isAIPlayer(currentPlayerObj.player_id)) {
    return
  }

  // Schedule the move
  setTimeout(async () => {
    try {
      // Double-check game is still active
      if (room.status !== ROOM_STATUS.PLAYING) {
        return
      }

      const move = await selectMove(room.board, room.difficulty)

      const success = room.handleMove(
        currentPlayerObj.token,
        move.row,
        move.side
      )

      if (success) {
        io.to(room.id).emit("game_update", room.getGameState())

        // Check if next player is also AI and schedule their move
        scheduleAIMove(room, io, delay)
      }
    } catch (error) {
      console.error("Error in AI move:", error)
    }
  }, delay)
}

module.exports = {
  isAIPlayer,
  selectMove,
  scheduleAIMove,
}
