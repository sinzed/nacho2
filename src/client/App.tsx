import React, { useState, useEffect } from 'react';
import { Client, Room } from 'colyseus.js';
import Lobby from './components/Lobby';
import QuestionnairePhase from './components/QuestionnairePhase';
import TriviaPhase from './components/TriviaPhase';
import DiscussionPhase from './components/DiscussionPhase';
import VotingPhase from './components/VotingPhase';
import EliminationPhase from './components/EliminationPhase';
import FinalRoundPhase from './components/FinalRoundPhase';
import GameOver from './components/GameOver';
import { GameState } from '../rooms/schema/GameState';

const client = new Client('ws://localhost:2567');

function App() {
  const [room, setRoom] = useState<Room<GameState> | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    if (room) {
      // Set initial state immediately
      setGameState(room.state);
      
      // Listen for state changes
      room.onStateChange((state) => {
        console.log('State changed:', state.phase, 'Players:', state.players?.size || 0);
        setGameState(state);
        
        // Re-setup MapSchema listeners if players map is available
        if (state.players && !state.players.onAdd) {
          state.players.onAdd = (player, key) => {
            console.log('Player added to MapSchema:', player.name, key);
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1);
          };
          state.players.onRemove = (player, key) => {
            console.log('Player removed from MapSchema:', key);
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1);
          };
        }
      });
      
      // Also listen for MapSchema changes specifically to ensure React updates
      // Wait a bit for state to be ready
      setTimeout(() => {
        if (room.state && room.state.players) {
          room.state.players.onAdd = (player, key) => {
            console.log('Player added to MapSchema:', player.name, key);
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1); // Force re-render
          };
          room.state.players.onRemove = (player, key) => {
            console.log('Player removed from MapSchema:', key);
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1); // Force re-render
          };
        }
      }, 100);

      room.onMessage('phaseChanged', (message) => {
        console.log('Phase changed:', message);
      });

      room.onMessage('playerJoined', (message) => {
        console.log('Player joined message:', message);
        // Force state update when player joins
        if (room.state) {
          setGameState(room.state);
        }
      });

      room.onMessage('questionAdvanced', (message) => {
        console.log('Question advanced:', message);
      });

      room.onMessage('gameOver', (message) => {
        console.log('Game over:', message);
      });

      room.onMessage('error', (message) => {
        alert(message.message);
      });

      room.onLeave(() => {
        setRoom(null);
        setGameState(null);
      });
    }
  }, [room]);

  const joinRoom = async (roomCode: string, name: string) => {
    try {
      // Try to join existing room first
      let newRoom;
      try {
        newRoom = await client.join<GameState>('nuchos_enigma', {
          roomCode,
          name,
        });
        console.log('Joined existing room:', newRoom.roomId, 'Code:', newRoom.state.roomCode);
      } catch (joinError) {
        console.log('Join failed, trying joinOrCreate:', joinError);
        // If join fails, try joinOrCreate
        newRoom = await client.joinOrCreate<GameState>('nuchos_enigma', {
          roomCode,
          name,
        });
        console.log('Created/joined room:', newRoom.roomId, 'Code:', newRoom.state.roomCode);
      }
      console.log('Room state players:', newRoom.state?.players?.size || 0);
      setRoom(newRoom);
      setGameState(newRoom.state);
      setPlayerName(name);
      setSessionId(newRoom.sessionId);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  const createRoom = async (name: string) => {
    try {
      const newRoom = await client.create<GameState>('nuchos_enigma', {
        name,
      });
      console.log('Room created:', newRoom.roomId, 'State:', newRoom.state);
      console.log('Room code:', newRoom.state?.roomCode);
      console.log('Players:', newRoom.state?.players?.size || 0);
      setRoom(newRoom);
      setGameState(newRoom.state);
      setPlayerName(name);
      setSessionId(newRoom.sessionId);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  if (!room || !gameState) {
    return <Lobby onJoinRoom={joinRoom} onCreateRoom={createRoom} />;
  }

  const currentPlayer = Array.from(gameState.players.values()).find(
    (p) => p.sessionId === sessionId
  );

  switch (gameState.phase) {
    case 'lobby':
      return <Lobby onJoinRoom={joinRoom} onCreateRoom={createRoom} room={room} gameState={gameState} sessionId={sessionId} />;
    case 'questionnaire':
      return (
        <QuestionnairePhase
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    case 'trivia':
      return (
        <TriviaPhase
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    case 'discussion':
      return (
        <DiscussionPhase
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    case 'voting':
      return (
        <VotingPhase
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    case 'elimination':
      return (
        <EliminationPhase
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    case 'final_round':
      return (
        <FinalRoundPhase
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    case 'game_over':
      return (
        <GameOver
          room={room}
          gameState={gameState}
          currentPlayer={currentPlayer}
          sessionId={sessionId}
        />
      );
    default:
      return <div>Unknown phase: {gameState.phase}</div>;
  }
}

export default App;

