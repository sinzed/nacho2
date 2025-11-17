import React from 'react';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface EliminationPhaseProps {
  room: any;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const EliminationPhase: React.FC<EliminationPhaseProps> = ({
  gameState,
  currentPlayer,
}) => {
  const eliminatedPlayer = gameState.eliminatedPlayerId
    ? gameState.players.get(gameState.eliminatedPlayerId)
    : null;

  const wasNucho = eliminatedPlayer?.isNucho;
  const activePlayers = Array.from(gameState.players.values()).filter(p => !p.isEliminated);

  return (
    <div className="phase-container">
      <div className="phase-card">
        <h1>Elimination Results</h1>
        
        {eliminatedPlayer && (
          <div className={`elimination-result ${wasNucho ? 'nucho-revealed' : ''}`}>
            {wasNucho ? (
              <>
                <h2>🎭 The Nucho has been found!</h2>
                <p className="eliminated-name">{eliminatedPlayer.name} was the Nucho!</p>
                <p className="team-win">The team wins this round!</p>
              </>
            ) : (
              <>
                <h2>❌ {eliminatedPlayer.name} has been eliminated</h2>
                <p className="eliminated-name">They were not the Nucho...</p>
                <p className="nucho-still-hidden">The Nucho is still among you!</p>
              </>
            )}
          </div>
        )}

        <div className="remaining-players">
          <h3>Remaining Players: {activePlayers.length}</h3>
          <ul>
            {activePlayers.map((player) => (
              <li key={player.sessionId}>
                {player.name} - Score: {player.score}
              </li>
            ))}
          </ul>
        </div>

        {activePlayers.length <= 3 ? (
          <div className="final-round-notice">
            <p>⚠️ Only {activePlayers.length} players remain!</p>
            <p>Final round starting soon...</p>
          </div>
        ) : (
          <div className="next-round-notice">
            <p>Next round starting soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EliminationPhase;

