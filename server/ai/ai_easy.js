function selectMove(board) {
  const validMoves = board.getValidMoves()

  if (validMoves.length === 0) {
    return null
  }

  // Pick a random move
  const randomIndex = Math.floor(Math.random() * validMoves.length)
  return validMoves[randomIndex]
}

module.exports = {
  selectMove,
}
