import React from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface DiscussionPhaseProps {
  room: Room<GameState>;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({
  room,
  gameState,
  currentPlayer,
  sessionId,
}) => {
  const activePlayers = Array.from(gameState.players.values()).filter(p => !p.isEliminated);
  const isEliminated = currentPlayer?.isEliminated;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isEliminated) {
    return (
      <div className="phase-container">
        <div className="phase-card">
          <h1>Discussion Phase</h1>
          <p>You've been eliminated. Watch the discussion!</p>
          <div className="timer">
            <span className="timer-value">{formatTime(gameState.discussionTimeRemaining)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phase-container">
      <div className="phase-card">
        <h1>Discussion Phase</h1>
        <p className="phase-description">
          Discuss who you think the Nucho is! Look for suspicious behavior, 
          unusual answers, or someone who seems to know too much.
        </p>

        <div className="timer">
          <span className="timer-label">Time Remaining:</span>
          <span className="timer-value">{formatTime(gameState.discussionTimeRemaining)}</span>
        </div>

        <div className="players-grid">
          <h3>Active Players</h3>
          <div className="players-list">
            {activePlayers.map((player) => (
              <div key={player.sessionId} className="player-item">
                <div className="player-name">
                  {player.name} {player.sessionId === sessionId && '(You)'}
                </div>
                <div className="player-stats">
                  <span>Score: {player.score}</span>
                  <span>Trivia: {player.triviaAnswers}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="discussion-tips">
          <h3>💡 Discussion Tips:</h3>
          <ul>
            <li>Who answered the trivia questions too quickly?</li>
            <li>Who had suspicious questionnaire answers?</li>
            <li>Who seems to be avoiding suspicion?</li>
            <li>Remember: The Nucho knows all trivia answers!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPhase;

