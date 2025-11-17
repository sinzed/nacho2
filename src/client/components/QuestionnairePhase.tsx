import React, { useState, useEffect } from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';
import { Player } from '../../rooms/schema/Player';

interface QuestionnairePhaseProps {
  room: Room<GameState>;
  gameState: GameState;
  currentPlayer: Player | undefined;
  sessionId: string;
}

const QuestionnairePhase: React.FC<QuestionnairePhaseProps> = ({
  room,
  gameState,
  currentPlayer,
  sessionId,
}) => {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [nuchoAnswers, setNuchoAnswers] = useState<Map<string, string>>(new Map());

  const isNucho = currentPlayer?.isNucho;

  useEffect(() => {
    if (isNucho && gameState.questionnaireQuestions.length > 0 && selectedQuestions.length === 0) {
      // Nucho needs to select 3 questions
      const allQuestions = Array.from(gameState.questionnaireQuestions);
      setSelectedQuestions(allQuestions.map(q => q.id));
    }
  }, [isNucho, gameState.questionnaireQuestions]);

  const handleAnswer = (questionId: string, answer: string) => {
    if (isNucho) {
      const newAnswers = new Map(nuchoAnswers);
      newAnswers.set(questionId, answer);
      setNuchoAnswers(newAnswers);
    } else {
      const newAnswers = new Map(answers);
      newAnswers.set(questionId, answer);
      setAnswers(newAnswers);
      room.send('answerQuestionnaire', { questionId, answer });
    }
  };

  const handleNuchoSubmit = () => {
    if (selectedQuestions.length === 3 && nuchoAnswers.size === 3) {
      room.send('nuchoSelectQuestions', {
        questionIds: selectedQuestions,
        answers: selectedQuestions.map(qId => nuchoAnswers.get(qId) || ''),
      });
    }
  };

  if (isNucho) {
    return (
      <div className="phase-container">
        <div className="phase-card">
          <h1>You are the Nucho! 🎭</h1>
          <p className="nucho-warning">Keep your identity secret! Select questions and pre-fill answers.</p>
          
          <div className="questions-list">
            {gameState.questionnaireQuestions.map((question) => (
              <div key={question.id} className="question-card">
                <h3>{question.text}</h3>
                <input
                  type="text"
                  placeholder="Enter your answer"
                  value={nuchoAnswers.get(question.id) || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="answer-input"
                />
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleNuchoSubmit}
            disabled={nuchoAnswers.size < 3}
          >
            Submit Answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phase-container">
      <div className="phase-card">
        <h1>Questionnaire Phase</h1>
        <p>Answer these personal questions. The Nucho has pre-filled their answers!</p>
        
        <div className="questions-list">
          {gameState.questionnaireQuestions.map((question) => (
            <div key={question.id} className="question-card">
              <h3>{question.text}</h3>
              {question.nuchoAnswer && (
                <div className="nucho-answer-hint">
                  <strong>Nucho's answer:</strong> {question.nuchoAnswer}
                </div>
              )}
              <input
                type="text"
                placeholder="Enter your answer"
                value={answers.get(question.id) || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                className="answer-input"
              />
            </div>
          ))}
        </div>

        <div className="status">
          {currentPlayer?.hasAnsweredQuestionnaire ? (
            <p className="success-text">✓ Answers submitted! Waiting for others...</p>
          ) : (
            <p>Please answer all questions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnairePhase;

