import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./App.css"
import Lobby from "./components/Lobby"
import GameRoom from "./components/GameRoom"

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path=":roomId" element={<GameRoom />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
