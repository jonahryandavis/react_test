import React from "react"

function Navigation({
  roomId,
  myToken,
  difficulty,
  showEmphasizedBack,
  onBack,
}) {
  return (
    <div className="navigation">
      <button
        className={showEmphasizedBack ? "button-primary" : "button-outline"}
        onClick={onBack}
      >
        Back to Lobby
      </button>
      <h4>Room: {roomId}</h4>
      <h4>You are: {myToken}</h4>
      <h4>Difficulty: {difficulty}</h4>
    </div>
  )
}

export default Navigation
