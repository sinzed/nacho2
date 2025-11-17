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
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (room) {
      // Set initial state immediately
      setGameState(room.state);
      
      // Polling mechanism as fallback to ensure UI updates
      let lastPlayerCount = room.state?.players?.size || 0;
      pollInterval = setInterval(() => {
        if (room.state && room.state.players) {
          const currentCount = room.state.players.size;
          // Get current sessionId from the room or state
          const currentSessionId = room.sessionId;
          const currentPlayerExists = currentSessionId && room.state.players.has(currentSessionId);
          
          // Update if count changed OR if current player is missing from list (and we have a sessionId)
          if (currentCount !== lastPlayerCount || (currentSessionId && !currentPlayerExists && currentCount > 0)) {
            console.log('Player count changed via polling:', lastPlayerCount, '->', currentCount);
            console.log('Current player exists:', currentPlayerExists, 'SessionId:', currentSessionId);
            lastPlayerCount = currentCount;
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1);
          }
        }
      }, 300); // Check every 300ms for faster updates
      
      // Listen for state changes
      room.onStateChange((state) => {
        const playerCount = state.players?.size || 0;
        console.log('State changed:', state.phase, 'Players:', playerCount);
        setGameState(state);
        setUpdateTrigger(prev => prev + 1); // Always trigger update on state change
        
        // Re-setup MapSchema listeners if players map is available
        if (state.players) {
          // Remove old listeners if they exist
          if (state.players.onAdd) {
            delete state.players.onAdd;
          }
          if (state.players.onRemove) {
            delete state.players.onRemove;
          }
          
          // Set up new listeners
          state.players.onAdd = (player, key) => {
            console.log('MapSchema onAdd triggered - Player:', player.name, 'Key:', key);
            // Use a small delay to ensure state is fully updated
            setTimeout(() => {
              setGameState(room.state);
              setUpdateTrigger(prev => prev + 1);
            }, 10);
          };
          state.players.onRemove = (player, key) => {
            console.log('MapSchema onRemove triggered - Key:', key);
            setTimeout(() => {
              setGameState(room.state);
              setUpdateTrigger(prev => prev + 1);
            }, 10);
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
        console.log('Message players:', message.players);
        // Force state update when player joins - use setTimeout to ensure state is updated
        setTimeout(() => {
          if (room.state) {
            console.log('Forcing state update after playerJoined, players:', room.state.players?.size);
            // Check if current player is in the list
            const currentPlayerInList = room.state.players?.get(sessionId);
            console.log('Current player in state:', currentPlayerInList?.name);
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1);
          }
        }, 100);
      });

      room.onMessage('playerListUpdate', (message) => {
        console.log('Player list update received:', message);
        console.log('Players in message:', message.players);
        // Force state update with the received player list
        setTimeout(() => {
          if (room.state) {
            console.log('Updating state from playerListUpdate, players:', room.state.players?.size);
            setGameState(room.state);
            setUpdateTrigger(prev => prev + 1);
          }
        }, 50);
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
    
    // Cleanup polling interval
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
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
      if (newRoom.state?.players) {
        console.log('Players in room state:');
        Array.from(newRoom.state.players.values()).forEach(p => {
          console.log('  - Player:', p.name, p.sessionId);
        });
      }
      setRoom(newRoom);
      setGameState(newRoom.state);
      setPlayerName(name);
      setSessionId(newRoom.sessionId);
      
      // Wait a bit for state to fully sync, then refresh
      setTimeout(() => {
        if (newRoom.state) {
          console.log('State after join delay - Players:', newRoom.state.players?.size || 0);
          if (newRoom.state.players) {
            console.log('Players after delay:');
            Array.from(newRoom.state.players.values()).forEach(p => {
              console.log('  - Player:', p.name, p.sessionId);
            });
          }
          setGameState(newRoom.state);
          setUpdateTrigger(prev => prev + 1);
        }
      }, 300);
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
      console.log('Initial players:', newRoom.state?.players?.size || 0);
      
      setRoom(newRoom);
      setPlayerName(name);
      setSessionId(newRoom.sessionId);
      
      // Wait a bit for onJoin to complete and state to sync
      setTimeout(() => {
        if (newRoom.state) {
          console.log('State after delay - Players:', newRoom.state.players?.size || 0);
          setGameState(newRoom.state);
          // Force an update trigger
          setUpdateTrigger(prev => prev + 1);
        }
      }, 200);
      
      // Also set initial state immediately
      setGameState(newRoom.state);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  if (!room || !gameState) {
    return <Lobby onJoinRoom={joinRoom} onCreateRoom={createRoom} updateTrigger={updateTrigger} />;
  }

  const currentPlayer = gameState.players ? Array.from(gameState.players.values()).find(
    (p) => p.sessionId === sessionId
  ) : undefined;

  switch (gameState.phase) {
    case 'lobby':
      return <Lobby onJoinRoom={joinRoom} onCreateRoom={createRoom} room={room} gameState={gameState} sessionId={sessionId} updateTrigger={updateTrigger} />;
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

