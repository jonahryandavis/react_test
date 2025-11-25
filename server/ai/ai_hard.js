const { PLAYER, SIDE } = require("../board")

/**
 * Hard AI - LLM-powered strategic decision making
 * Uses Google Gemini API to analyze the game state and select optimal moves
 */

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || ""
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

/**
 * Format the board state for the LLM
 */
function formatBoardState(board) {
  const grid = board.grid
  let boardStr = "\nCurrent Board State (7x7 grid):\n"
  boardStr += "   0 1 2 3 4 5 6  (columns)\n"

  for (let r = 0; r < board.rows; r++) {
    boardStr += `${r}: `
    for (let c = 0; c < board.cols; c++) {
      const cell = grid[r][c]
      boardStr += cell ? cell : "."
      boardStr += " "
    }
    boardStr += `(row ${r})\n`
  }

  return boardStr
}

/**
 * Create the prompt for the LLM
 */
function createPrompt(board) {
  const aiPlayer = board.currentPlayer
  const opponent = aiPlayer === PLAYER.X ? PLAYER.O : PLAYER.X
  const validMoves = board.getValidMoves()

  const prompt = `You are playing a strategic game called Side Stacker (similar to Connect 4).

GAME RULES:
- 7x7 grid where pieces slide in from the LEFT or RIGHT side of each row
- When you play on a row from the LEFT, the piece stacks on the stack from the left side
- When you play on a row from the RIGHT, the piece stacks on the stack from the right side
- Goal: Get 4 in a row (horizontal, vertical, or diagonal)
- You are player: ${aiPlayer}
- Opponent is player: ${opponent}

${formatBoardState(board)}

VALID MOVES:
${validMoves
  .map(
    (m, i) =>
      `${i + 1}. Row ${m.row}, Side ${m.side === SIDE.LEFT ? "LEFT" : "RIGHT"}`
  )
  .join("\n")}

STRATEGIC PRIORITIES:
1. Win immediately if possible
2. Create multiple winning threats for yourself
3. Block opponent from immediately winning
4. Prevent opponent from creating unblockable double-threat situations (3-in-a-row with open spaces on both sides)
5. Block opponent from expanding their threats
6. Build toward strong positions

Analyze the board carefully and select the BEST move. Consider:
- Immediate winning moves
- Blocking opponent's winning moves
- Preventing opponent from setting up guaranteed wins
- Creating your own threats

Here are some tips:
- Try to create multiple winning threats for yourself
- Prevent opponent from creating unblockable double-threat situations
- Build in different rows with a single gap to create multiple threats
- Try to sneak in a diagonal threat
- Build from the middle out in multiple rows to create a double-blockable threat
- Do not focus solely on blocking the other player's threats

Respond with ONLY the move number (1-${
    validMoves.length
  }) and a brief explanation.
Format: "Move: X - [brief reason]"

Your response:`

  return prompt
}

/**
 * Call the Gemini API
 */
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set, falling back to random move")
    return null
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    })

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    return text
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return null
  }
}

/**
 * Parse the LLM response to extract the move number
 */
function parseLLMResponse(responseText) {
  if (!responseText) return null

  // Look for patterns like "Move: 3" or "3 -" or just a number at the start
  const patterns = [/Move:\s*(\d+)/i, /^(\d+)\s*[-:]/, /^(\d+)/]

  for (const pattern of patterns) {
    const match = responseText.match(pattern)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  return null
}

/**
 * Select move using LLM
 */
async function selectMove(board) {
  const validMoves = board.getValidMoves()

  if (validMoves.length === 0) {
    return null
  }

  // If only one move, just return it
  if (validMoves.length === 1) {
    return validMoves[0]
  }

  try {
    // Create prompt and call LLM
    const prompt = createPrompt(board)
    const llmResponse = await callGeminiAPI(prompt)

    console.log("LLM Response:", llmResponse)

    // Parse the response
    const moveNumber = parseLLMResponse(llmResponse)

    if (moveNumber && moveNumber >= 1 && moveNumber <= validMoves.length) {
      const selectedMove = validMoves[moveNumber - 1]
      console.log(
        `LLM selected move ${moveNumber}: Row ${selectedMove.row}, Side ${selectedMove.side}`
      )
      return selectedMove
    } else {
      console.warn("Could not parse LLM response, using fallback")
    }
  } catch (error) {
    console.error("Error in LLM move selection:", error)
  }

  // Fallback to random move if LLM fails
  const randomIndex = Math.floor(Math.random() * validMoves.length)
  return validMoves[randomIndex]
}

module.exports = {
  selectMove,
}
