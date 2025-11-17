import React, { useState } from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface FinalRoundPhaseProps {
  room: Room<GameState>;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const FinalRoundPhase: React.FC<FinalRoundPhaseProps> = ({
  room,
  gameState,
  currentPlayer,
  sessionId,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  const remainingPlayers = Array.from(gameState.players.values()).filter(p => !p.isEliminated);
  const isNucho = currentPlayer?.isNucho;
  const otherPlayers = remainingPlayers.filter(p => p.sessionId !== sessionId);

  const handleHandshake = (targetSessionId: string) => {
    if (currentPlayer?.finalHandshake) return;
    setSelectedTarget(targetSessionId);
    room.send('finalHandshake', { targetSessionId });
  };

  return (
    <div className="phase-container">
      <div className="phase-card">
        <h1>🎯 Final Round</h1>
        
        {isNucho ? (
          <>
            <div className="nucho-final-instructions">
              <h2>You are the Nucho!</h2>
              <p className="warning-text">
                You need to secure a handshake from one of the other players to win all the scores!
              </p>
              <p>Choose wisely - if the other two players shake hands with each other, they win instead.</p>
            </div>

            <div className="handshake-options">
              <h3>Who do you want to handshake with?</h3>
              {otherPlayers.map((player) => (
                <button
                  key={player.sessionId}
                  className={`btn handshake-btn ${selectedTarget === player.sessionId ? 'selected' : ''}`}
                  onClick={() => handleHandshake(player.sessionId)}
                  disabled={currentPlayer?.finalHandshake}
                >
                  🤝 Handshake with {player.name}
                </button>
              ))}
            </div>

            {currentPlayer?.finalHandshake && (
              <p className="success-text">✓ Handshake request sent! Waiting for response...</p>
            )}
          </>
        ) : (
          <>
            <div className="team-final-instructions">
              <h2>Final Standoff!</h2>
              <p>
                There are only {remainingPlayers.length} players left. One of you is the Nucho!
              </p>
              <p className="warning-text">
                If you and the other non-Nucho player shake hands, you share the scores. 
                If the Nucho handshakes with either of you, they win everything!
              </p>
            </div>

            <div className="handshake-options">
              <h3>Choose your action:</h3>
              {otherPlayers.map((player) => {
                const isNuchoPlayer = player.isNucho;
                return (
                  <button
                    key={player.sessionId}
                    className={`btn handshake-btn ${selectedTarget === player.sessionId ? 'selected' : ''} ${isNuchoPlayer ? 'nucho-option' : ''}`}
                    onClick={() => handleHandshake(player.sessionId)}
                    disabled={currentPlayer?.finalHandshake}
                  >
                    {isNuchoPlayer ? '🎭' : '🤝'} {isNuchoPlayer ? 'Handshake with ' : 'Handshake with '}{player.name}
                    {isNuchoPlayer && <span className="nucho-warning"> (Could be Nucho!)</span>}
                  </button>
                );
              })}
            </div>

            {currentPlayer?.finalHandshake && (
              <p className="success-text">✓ Handshake sent! Waiting for response...</p>
            )}
          </>
        )}

        <div className="final-round-players">
          <h3>Remaining Players:</h3>
          <ul>
            {remainingPlayers.map((player) => (
              <li key={player.sessionId}>
                {player.name} {player.sessionId === sessionId && '(You)'} - Score: {player.score}
                {player.isNucho && sessionId === player.sessionId && ' 🎭 (You are Nucho)'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FinalRoundPhase;

