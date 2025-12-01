import io from "socket.io-client"

// Connect to the current host (works with proxy in package.json)
const socket = io()

export default socket
