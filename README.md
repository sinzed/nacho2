# Nucho's Enigma 🎭

A multiplayer social deduction trivia game where players must identify the secret "Nucho" among them while answering trivia questions.

## Game Overview

**Nucho's Enigma** is a hybrid social deduction and trivia game for 5-10 players. Each round, one player is secretly assigned the role of "Nucho" who knows all the trivia answers. Players must work together to identify the Nucho while the Nucho tries to blend in and survive until the final round.

### Game Phases

1. **Lobby**: Players join with a room code (5-10 players required)
2. **Questionnaire Phase**: Players answer personal questions. The Nucho pre-fills their answers.
3. **Trivia Challenge**: 5 challenging general knowledge questions. The Nucho knows all answers!
4. **Discussion Phase**: 60 seconds to discuss and identify the Nucho
5. **Voting Phase**: Vote for who you think is the Nucho
6. **Elimination**: The player with most votes is eliminated (unless they're the Nucho, then team wins!)
7. **Final Round**: When only 3 players remain, the Nucho tries to secure a handshake to win all scores

### Scoring

- Regular players earn 10 points per correct trivia answer
- If the team wins, scores are shared equally among remaining non-Nucho players
- If the Nucho wins, they claim all accumulated scores

## Setup & Installation

### Prerequisites

- Node.js >= 20.9.0
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

## Running the Game

### Development Mode

Run both server and client in development mode:

```bash
npm run dev
```

This will start:
- **Server**: `http://localhost:2567` (Colyseus game server)
- **Client**: `http://localhost:3000` (React frontend)

### Production Mode

1. Build the server:
```bash
npm run build
```

2. Build the client:
```bash
npm run build:client
```

3. Start the server:
```bash
npm start
```

4. Serve the client build (the built files will be in `dist/` directory)

## How to Play

1. **Create a Room**: 
   - Enter your name
   - Click "Create New Game"
   - Share the room code with friends

2. **Join a Room**:
   - Enter your name and the room code
   - Click "Join Game"

3. **Start the Game**:
   - Wait for 5-10 players to join
   - The host clicks "Start Game"

4. **Gameplay**:
   - Answer questionnaire questions (Nucho pre-fills answers)
   - Answer trivia questions (Nucho knows all answers!)
   - Discuss and vote to eliminate the Nucho
   - Survive until the final round

## Project Structure

```
nacho2/
├── src/
│   ├── client/              # React frontend
│   │   ├── components/      # Game phase components
│   │   ├── App.tsx         # Main app component
│   │   └── styles.css      # Styling
│   ├── rooms/              # Colyseus game rooms
│   │   ├── schema/         # Game state schemas
│   │   ├── NuchosEnigmaRoom.ts  # Main game room logic
│   │   └── questions.ts    # Question pools
│   ├── app.config.ts       # Colyseus server config
│   └── index.ts            # Server entry point
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
└── package.json
```

## Features

- ✅ Real-time multiplayer synchronization
- ✅ Room-based matchmaking with room codes
- ✅ Dynamic question pools (15+ questionnaire questions, 20+ trivia questions)
- ✅ Timed discussion and voting phases
- ✅ Score tracking and final round mechanics
- ✅ Modern, responsive UI
- ✅ Player elimination system
- ✅ Final round handshake mechanic

## Technologies

- **Backend**: Colyseus (Node.js/TypeScript)
- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Real-time**: WebSockets via Colyseus

## Development

### Server Only
```bash
npm start
```

### Client Only
```bash
npm run start:client
```

### Testing
```bash
npm test
```

## License

UNLICENSED
