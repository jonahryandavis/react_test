import React from "react"
import { ROOM_TYPE, ROOM_STATUS } from "react-test-shared"

function Navigation({
  roomId,
  myToken,
  roomType,
  difficulty,
  status,
  showEmphasizedBack,
  onBack,
  onReplay,
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
      <h4>Room Type: {roomType}</h4>
      {roomType === ROOM_TYPE.PVAI || roomType === ROOM_TYPE.AIVAI ? (
        <h4>Difficulty: {difficulty}</h4>
      ) : null}
      {status === ROOM_STATUS.FINISHED ? (
        <button onClick={onReplay}>Replay</button>
      ) : null}
    </div>
  )
}

export default Navigation
