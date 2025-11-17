import React, { useState, useEffect } from 'react';
import { Room } from 'colyseus.js';
import { GameState } from '../../rooms/schema/GameState';

interface LobbyProps {
  onJoinRoom: (roomCode: string, name: string) => void;
  onCreateRoom: (name: string) => void;
  room?: Room<GameState>;
  gameState?: GameState;
  sessionId?: string;
  updateTrigger?: number; // Add update trigger prop
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom, onCreateRoom, room, gameState, sessionId, updateTrigger }) => {
  // Generate random name on component mount
  const generateRandomName = () => {
    const adjectives = ['Cool', 'Swift', 'Brave', 'Clever', 'Wise', 'Bold', 'Quick', 'Smart', 'Sharp', 'Bright', 'Fast', 'Strong', 'Calm', 'Wild', 'Silent'];
    const nouns = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Lion', 'Bear', 'Hawk', 'Falcon', 'Panther', 'Jaguar', 'Raven', 'Phoenix', 'Dragon', 'Shark', 'Cobra'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adjective}${noun}${number}`;
  };

  const [name, setName] = useState(() => generateRandomName());
  const [roomCode, setRoomCode] = useState('');

  if (room && gameState) {
    // Convert MapSchema to array, handling undefined case
    const playersMap = gameState.players;
    const players = playersMap ? Array.from(playersMap.values()) : [];
    const isHost = players.length > 0 && players[0].sessionId === sessionId;

    // Debug: Log state changes
    useEffect(() => {
      console.log('Lobby render - Players:', players.length, 'Room Code:', gameState.roomCode);
      if (players.length > 0) {
        console.log('Player list:', players.map(p => ({ name: p.name, id: p.sessionId })));
      }
      if (playersMap) {
        console.log('Players MapSchema size:', playersMap.size);
      }
    }, [players.length, gameState.roomCode, players, playersMap, updateTrigger]);

    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <h1>Nucho's Enigma</h1>
          <div className="room-info">
            <h2>Room Code: <span className="room-code">{gameState.roomCode || 'Loading...'}</span></h2>
            <p>Share this code with other players!</p>
          </div>
          
          <div className="players-list">
            <h3>Players ({players.length}/10)</h3>
            {players.length === 0 ? (
              <p className="waiting-text">Waiting for players to join...</p>
            ) : (
              <ul>
                {players.map((player) => (
                  <li key={player.sessionId}>
                    {player.name} {player.sessionId === sessionId && '(You)'}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isHost && (
            <button
              className="btn btn-primary"
              onClick={() => room.send('startGame')}
              disabled={players.length < 5 || players.length > 10}
            >
              Start Game ({players.length} players)
            </button>
          )}

          {!isHost && (
            <p className="waiting-text">Waiting for host to start the game...</p>
          )}

          {players.length < 5 && (
            <p className="warning-text">Need at least 5 players to start</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h1>Nucho's Enigma</h1>
        <p className="subtitle">A multiplayer social deduction trivia game</p>
        
        <div className="input-group">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setName(generateRandomName())}
              className="btn-random-name"
              title="Generate random name"
            >
              🎲
            </button>
          </div>
        </div>

        <div className="lobby-actions">
          <div className="action-section">
            <h3>Create Room</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (name.trim()) {
                  onCreateRoom(name.trim());
                } else {
                  alert('Please enter your name');
                }
              }}
            >
              Create New Game
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="action-section">
            <h3>Join Room</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={5}
              />
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (name.trim() && roomCode.trim()) {
                  onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
                } else {
                  alert('Please enter your name and room code');
                }
              }}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

