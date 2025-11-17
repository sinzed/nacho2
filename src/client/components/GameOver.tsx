import React from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface GameOverProps {
  room: Room<GameState>;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const GameOver: React.FC<GameOverProps> = ({
  gameState,
  currentPlayer,
}) => {
  const allPlayers = Array.from(gameState.players.values());
  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
  const winner = gameState.winner;
  const nucho = allPlayers.find(p => p.isNucho);
  const teamPlayers = allPlayers.filter(p => !p.isNucho && !p.isEliminated);

  const handlePlayAgain = () => {
    window.location.reload();
  };

  return (
    <div className="phase-container">
      <div className="phase-card game-over-card">
        <h1>🎮 Game Over!</h1>
        
        {winner === 'nucho' && nucho ? (
          <div className="winner-announcement nucho-win">
            <h2>🎭 The Nucho Wins!</h2>
            <p className="winner-name">{nucho.name} successfully deceived everyone!</p>
            <p className="winner-score">Final Score: {nucho.score} points</p>
          </div>
        ) : (
          <div className="winner-announcement team-win">
            <h2>👥 The Team Wins!</h2>
            <p>The team successfully identified and eliminated the Nucho!</p>
            <div className="team-scores">
              {teamPlayers.map((player) => (
                <div key={player.sessionId} className="team-player-score">
                  <span>{player.name}: {player.score} points</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="final-scores">
          <h3>Final Scores</h3>
          <div className="scoreboard">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.sessionId}
                className={`scoreboard-item ${player.isNucho ? 'nucho-player' : ''} ${player.sessionId === sessionId ? 'your-score' : ''}`}
              >
                <span className="rank">#{index + 1}</span>
                <span className="name">
                  {player.name} {player.sessionId === sessionId && '(You)'}
                  {player.isNucho && ' 🎭'}
                </span>
                <span className="score">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handlePlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOver;

