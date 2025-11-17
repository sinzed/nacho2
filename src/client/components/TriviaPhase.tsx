import React, { useState, useEffect } from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface TriviaPhaseProps {
  room: Room<GameState>;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const TriviaPhase: React.FC<TriviaPhaseProps> = ({
  room,
  gameState,
  currentPlayer,
  sessionId,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const currentQuestion = gameState.triviaQuestions[gameState.currentQuestionIndex];
  const isNucho = currentPlayer?.isNucho;
  const isEliminated = currentPlayer?.isEliminated;

  useEffect(() => {
    setSelectedAnswer('');
    // Auto-select correct answer for Nucho
    if (isNucho && currentQuestion && !answeredQuestions.has(gameState.currentQuestionIndex)) {
      // Don't auto-submit, but show which is correct
    }
  }, [gameState.currentQuestionIndex, currentQuestion, isNucho]);

  const handleAnswer = (answer: string) => {
    if (answeredQuestions.has(gameState.currentQuestionIndex)) return;
    
    setSelectedAnswer(answer);
    setAnsweredQuestions(new Set([...answeredQuestions, gameState.currentQuestionIndex]));
    
    room.send('answerTrivia', {
      questionIndex: gameState.currentQuestionIndex,
      answer,
    });
  };

  if (isEliminated) {
    return (
      <div className="phase-container">
        <div className="phase-card">
          <h1>You've been eliminated!</h1>
          <p>You can still watch the game, but you cannot participate.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="phase-container">
        <div className="phase-card">
          <h1>Trivia Phase</h1>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phase-container">
      <div className="phase-card">
        <h1>Trivia Challenge</h1>
        <div className="trivia-header">
          <p>Question {gameState.currentQuestionIndex + 1} of {gameState.triviaQuestions.length}</p>
          <p>Your Score: {currentPlayer?.score || 0}</p>
          {isNucho && <p className="nucho-badge">🎭 You are the Nucho - you know the answers!</p>}
        </div>

        <div className="question-card large">
          <h2>{currentQuestion.text}</h2>
          
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isAnswered = answeredQuestions.has(gameState.currentQuestionIndex);
              const isCorrect = option === currentQuestion.correctAnswer;
              const showCorrect = isNucho && !isAnswered; // Show correct answer to Nucho before answering
              
              return (
                <button
                  key={index}
                  className={`option-btn ${isSelected ? 'selected' : ''} ${isAnswered ? 'answered' : ''} ${showCorrect && isCorrect ? 'nucho-correct' : ''}`}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  title={showCorrect && isCorrect ? 'Correct answer (you are Nucho!)' : ''}
                >
                  {option}
                  {showCorrect && isCorrect && <span className="nucho-hint">✓</span>}
                </button>
              );
            })}
          </div>

          {answeredQuestions.has(gameState.currentQuestionIndex) && (
            <div className="answer-feedback">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <p className="correct">✓ Correct! +10 points</p>
              ) : (
                <p className="incorrect">✗ Wrong. Correct answer: {currentQuestion.correctAnswer}</p>
              )}
            </div>
          )}
        </div>

        <div className="trivia-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((gameState.currentQuestionIndex + 1) / gameState.triviaQuestions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriviaPhase;

