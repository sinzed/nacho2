import React, { useState } from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface VotingPhaseProps {
  room: Room<GameState>;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const VotingPhase: React.FC<VotingPhaseProps> = ({
  room,
  gameState,
  currentPlayer,
  sessionId,
}) => {
  const [selectedVote, setSelectedVote] = useState<string>('');

  const activePlayers = Array.from(gameState.players.values()).filter(
    (p) => !p.isEliminated && p.sessionId !== sessionId
  );
  const isEliminated = currentPlayer?.isEliminated;
  const hasVoted = currentPlayer?.hasVoted;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVote = (targetSessionId: string) => {
    if (hasVoted) return;
    setSelectedVote(targetSessionId);
    room.send('vote', { targetSessionId });
  };

  if (isEliminated) {
    return (
      <div className="phase-container">
        <div className="phase-card">
          <h1>Voting Phase</h1>
          <p>You've been eliminated. Watch the voting!</p>
          <div className="timer">
            <span className="timer-value">{formatTime(gameState.votingTimeRemaining)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phase-container">
      <div className="phase-card">
        <h1>Voting Phase</h1>
        <p className="phase-description">
          Vote for who you think is the Nucho. The player with the most votes will be eliminated!
        </p>

        <div className="timer">
          <span className="timer-label">Time Remaining:</span>
          <span className="timer-value">{formatTime(gameState.votingTimeRemaining)}</span>
        </div>

        {hasVoted ? (
          <div className="voting-complete">
            <p className="success-text">✓ Vote submitted! Waiting for others...</p>
            {selectedVote && (
              <p>You voted for: {gameState.players.get(selectedVote)?.name}</p>
            )}
          </div>
        ) : (
          <div className="voting-options">
            <h3>Who do you think is the Nucho?</h3>
            <div className="vote-buttons">
              {activePlayers.map((player) => (
                <button
                  key={player.sessionId}
                  className={`btn vote-btn ${selectedVote === player.sessionId ? 'selected' : ''}`}
                  onClick={() => handleVote(player.sessionId)}
                  disabled={hasVoted}
                >
                  {player.name}
                  <div className="player-vote-stats">
                    <span>Score: {player.score}</span>
                    <span>Trivia: {player.triviaAnswers}/5</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingPhase;

