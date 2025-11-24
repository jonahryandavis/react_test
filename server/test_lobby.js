const { io } = require("socket.io-client")
const { spawn } = require("child_process")
const { ROOM_TYPE } = require("./room")

const PORT = 3001
const URL = `http://localhost:${PORT}`

let serverProcess

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn("node", ["server/index.js"], {
      cwd: "/home/jbrd/Documents/react_test",
      stdio: "inherit",
    })

    // Give it a second to start
    setTimeout(resolve, 2000)
  })
}

function createClient() {
  return io(URL, {
    transports: ["websocket"],
    forceNew: true,
  })
}

async function testPvP() {
  console.log("--- Testing PvP ---")
  const p1 = createClient()
  const p2 = createClient()

  return new Promise((resolve, reject) => {
    let p1Started = false
    let p2Started = false

    p1.on("connect", () => {
      console.log("P1 connected")
      p1.emit("join_game", { mode: ROOM_TYPE.PVP })
    })

    p1.on("waiting_for_opponent", () => {
      console.log("P1 waiting...")
      // Now connect P2
      p2.connect()
    })

    p2.on("connect", () => {
      console.log("P2 connected")
      p2.emit("join_game", { mode: ROOM_TYPE.PVP })
    })

    p1.on("game_start", (data) => {
      console.log("P1 Game Start:", data.roomId)
      p1Started = true
      if (p1Started && p2Started) resolve()
    })

    p2.on("game_start", (data) => {
      console.log("P2 Game Start:", data.roomId)
      p2Started = true
      if (p1Started && p2Started) resolve()
    })

    setTimeout(() => reject("PvP Timeout"), 5000)
  }).then(() => {
    p1.disconnect()
    p2.disconnect()
    console.log("PvP Passed")
  })
}

async function testPvAI() {
  console.log("--- Testing PvAI ---")
  const p1 = createClient()

  return new Promise((resolve, reject) => {
    p1.on("connect", () => {
      p1.emit("join_game", { mode: ROOM_TYPE.PVAI })
    })

    p1.on("game_start", (data) => {
      console.log("PvAI Game Start:", data.roomId)
      if (data.type === ROOM_TYPE.PVAI) resolve()
    })

    setTimeout(() => reject("PvAI Timeout"), 2000)
  }).then(() => {
    p1.disconnect()
    console.log("PvAI Passed")
  })
}

async function testAIvAI() {
  console.log("--- Testing AIvAI ---")
  const p1 = createClient()

  return new Promise((resolve, reject) => {
    p1.on("connect", () => {
      p1.emit("join_game", { mode: ROOM_TYPE.AIVAI })
    })

    p1.on("game_start", (data) => {
      console.log("AIvAI Game Start:", data.roomId)
      if (data.type === ROOM_TYPE.AIVAI) resolve()
    })

    setTimeout(() => reject("AIvAI Timeout"), 2000)
  }).then(() => {
    p1.disconnect()
    console.log("AIvAI Passed")
  })
}

async function runTests() {
  try {
    await startServer()
    await testPvP()
    await testPvAI()
    await testAIvAI()
    console.log("ALL TESTS PASSED")
  } catch (err) {
    console.error("TEST FAILED:", err)
    process.exit(1)
  } finally {
    if (serverProcess) serverProcess.kill()
    process.exit(0)
  }
}

runTests()
