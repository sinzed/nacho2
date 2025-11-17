import { Room, Client } from "@colyseus/core";
import { GameState, GamePhase } from "./schema/GameState";
import { Player } from "./schema/Player";
import { Question } from "./schema/Question";
import { QUESTIONNAIRE_QUESTIONS, TRIVIA_QUESTIONS } from "./questions";

export class NuchosEnigmaRoom extends Room<GameState> {
  maxClients = 10;
  minClients = 5;
  state = new GameState();
  
  private discussionTimer?: NodeJS.Timeout;
  private votingTimer?: NodeJS.Timeout;
  private triviaTimer?: NodeJS.Timeout;
  private playerAnswers: Map<string, Map<string, string>> = new Map(); // sessionId -> questionId -> answer
  private triviaAnswers: Map<string, Map<number, string>> = new Map(); // sessionId -> questionIndex -> answer

  onCreate(options: any) {
    // Generate room code or use provided one
    this.state.roomCode = options.roomCode || this.generateRoomCode();
    this.state.phase = GamePhase.LOBBY;
    
    // Set metadata for room filtering
    this.setMetadata({ roomCode: this.state.roomCode });


    // Handle starting the game
    this.onMessage("startGame", (client) => {
      if (this.state.phase !== GamePhase.LOBBY) return;
      if (this.state.players.size < this.minClients || this.state.players.size > this.maxClients) {
        this.send(client, "error", { message: `Need ${this.minClients}-${this.maxClients} players to start` });
        return;
      }
      this.startNewRound();
    });

    // Handle questionnaire answers
    this.onMessage("answerQuestionnaire", (client, message: { questionId: string, answer: string }) => {
      if (this.state.phase !== GamePhase.QUESTIONNAIRE) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isNucho) return; // Nucho doesn't answer questionnaire normally
      
      if (!this.playerAnswers.has(client.sessionId)) {
        this.playerAnswers.set(client.sessionId, new Map());
      }
      this.playerAnswers.get(client.sessionId)!.set(message.questionId, message.answer);
      player.hasAnsweredQuestionnaire = true;
      
      this.checkQuestionnaireComplete();
    });

    // Handle Nucho selecting and answering questions
    this.onMessage("nuchoSelectQuestions", (client, message: { questionIds: string[], answers: string[] }) => {
      if (this.state.phase !== GamePhase.QUESTIONNAIRE) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isNucho) return;
      
      // Set Nucho's pre-filled answers
      message.questionIds.forEach((qId, index) => {
        const question = this.state.questionnaireQuestions.find(q => q.id === qId);
        if (question) {
          question.nuchoAnswer = message.answers[index];
        }
      });
      
      player.hasAnsweredQuestionnaire = true;
      this.checkQuestionnaireComplete();
    });

    // Handle trivia answers
    this.onMessage("answerTrivia", (client, message: { questionIndex: number, answer: string }) => {
      if (this.state.phase !== GamePhase.TRIVIA) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isEliminated) return;
      
      if (!this.triviaAnswers.has(client.sessionId)) {
        this.triviaAnswers.set(client.sessionId, new Map());
      }
      this.triviaAnswers.get(client.sessionId)!.set(message.questionIndex, message.answer);
      
      // Nucho always gets correct answer
      if (player.isNucho) {
        const question = this.state.triviaQuestions[message.questionIndex];
        if (question && message.answer === question.correctAnswer) {
          player.triviaAnswers++;
        }
      } else {
        // Check if answer is correct
        const question = this.state.triviaQuestions[message.questionIndex];
        if (question && message.answer === question.correctAnswer) {
          player.triviaAnswers++;
          player.score += 10; // 10 points per correct answer
        }
      }
      
      player.hasAnsweredTrivia = true;
      this.checkTriviaComplete();
    });

    // Handle voting
    this.onMessage("vote", (client, message: { targetSessionId: string }) => {
      if (this.state.phase !== GamePhase.VOTING) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isEliminated || player.hasVoted) return;
      
      player.hasVoted = true;
      player.votedFor = message.targetSessionId;
      
      const currentCount = this.state.voteCounts.get(message.targetSessionId) || 0;
      this.state.voteCounts.set(message.targetSessionId, currentCount + 1);
      
      this.checkVotingComplete();
    });

    // Handle final round handshake
    this.onMessage("finalHandshake", (client, message: { targetSessionId: string }) => {
      if (this.state.phase !== GamePhase.FINAL_ROUND) return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      if (player.isNucho) {
        player.handshakeTarget = message.targetSessionId;
        player.finalHandshake = true;
        this.checkFinalRoundComplete();
      } else {
        // Non-Nucho players can handshake with each other
        const targetPlayer = this.state.players.get(message.targetSessionId);
        if (targetPlayer && !targetPlayer.isNucho && !targetPlayer.isEliminated) {
          player.handshakeTarget = message.targetSessionId;
          player.finalHandshake = true;
          this.checkFinalRoundComplete();
        }
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined room", this.state.roomCode, "with name:", options.name);
    console.log("Current players before join:", this.state.players.size);
    Array.from(this.state.players.values()).forEach(p => {
      console.log("  - Existing player:", p.name, p.sessionId);
    });
    
    // Create player when they join (always in lobby phase when joining)
    if (options.name) {
      const player = new Player();
      player.sessionId = client.sessionId;
      player.name = options.name;
      this.state.players.set(client.sessionId, player);
      
      console.log("Player added:", player.name, "Total players:", this.state.players.size);
      console.log("All players after join:");
      Array.from(this.state.players.values()).forEach(p => {
        console.log("  - Player:", p.name, p.sessionId);
      });
      
      // Send full player list to the newly joined client
      this.send(client, "playerListUpdate", {
        playerCount: this.state.players.size,
        players: Array.from(this.state.players.values()).map(p => ({ id: p.sessionId, name: p.name }))
      });
      
      // Broadcast player joined message to all other clients
      this.broadcast("playerJoined", { 
        playerCount: this.state.players.size,
        players: Array.from(this.state.players.values()).map(p => ({ id: p.sessionId, name: p.name }))
      }, { except: client });
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left room");
    this.state.players.delete(client.sessionId);
    
    // If game is in progress and player leaves, handle accordingly
    if (this.state.phase !== GamePhase.LOBBY && this.state.phase !== GamePhase.GAME_OVER) {
      const remainingPlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
      if (remainingPlayers.length < 3) {
        this.endGame("team"); // Team wins if too many leave
      }
    }
  }

  onDispose() {
    this.clearAllTimers();
    console.log("room", this.roomId, "disposing...");
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  private startNewRound() {
    this.clearAllTimers();
    
    // Reset round state
    this.state.round++;
    this.playerAnswers.clear();
    this.triviaAnswers.clear();
    
    // Select random Nucho
    const activePlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    if (activePlayers.length <= 3) {
      this.startFinalRound();
      return;
    }
    
    // Reset Nucho status
    activePlayers.forEach(p => p.isNucho = false);
    
    // Select new Nucho
    const nucho = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    nucho.isNucho = true;
    this.state.nuchoSessionId = nucho.sessionId;
    
    // Reset player states
    activePlayers.forEach(p => {
      p.hasVoted = false;
      p.votedFor = "";
      p.hasAnsweredQuestionnaire = false;
      p.hasAnsweredTrivia = false;
      p.triviaAnswers = 0;
    });
    
    // Clear vote counts
    this.state.voteCounts.clear();
    this.state.eliminatedPlayerId = "";
    
    // Start questionnaire phase
    this.startQuestionnairePhase();
  }

  private startQuestionnairePhase() {
    this.state.phase = GamePhase.QUESTIONNAIRE;
    this.state.questionnaireQuestions.clear();
    
    // Select 3 random questionnaire questions
    const shuffled = [...QUESTIONNAIRE_QUESTIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    selected.forEach((q, index) => {
      const question = new Question();
      question.id = `q_${index}`;
      question.text = q.text;
      question.type = "questionnaire";
      this.state.questionnaireQuestions.push(question);
    });
    
    this.broadcast("phaseChanged", { phase: GamePhase.QUESTIONNAIRE });
  }

  private checkQuestionnaireComplete() {
    const activePlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    const allAnswered = activePlayers.every(p => p.hasAnsweredQuestionnaire);
    
    if (allAnswered) {
      // Move to trivia phase after short delay
      setTimeout(() => {
        this.startTriviaPhase();
      }, 2000);
    }
  }

  private startTriviaPhase() {
    this.state.phase = GamePhase.TRIVIA;
    this.state.triviaQuestions.clear();
    this.state.currentQuestionIndex = 0;
    
    // Select 5 random trivia questions
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    selected.forEach((q, index) => {
      const question = new Question();
      question.id = `trivia_${index}`;
      question.text = q.text;
      question.type = "trivia";
      question.correctAnswer = q.correctAnswer;
      q.options.forEach(opt => question.options.push(opt));
      this.state.triviaQuestions.push(question);
    });
    
    this.broadcast("phaseChanged", { phase: GamePhase.TRIVIA });
    
    // Auto-advance questions every 20 seconds
    this.triviaTimer = setInterval(() => {
      if (this.state.currentQuestionIndex < this.state.triviaQuestions.length - 1) {
        this.state.currentQuestionIndex++;
        this.broadcast("questionAdvanced", { index: this.state.currentQuestionIndex });
      } else {
        clearInterval(this.triviaTimer);
        this.checkTriviaComplete();
      }
    }, 20000);
  }

  private checkTriviaComplete() {
    const activePlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    const allAnswered = activePlayers.every(p => p.hasAnsweredTrivia);
    
    if (allAnswered || this.state.currentQuestionIndex >= this.state.triviaQuestions.length - 1) {
      clearInterval(this.triviaTimer);
      setTimeout(() => {
        this.startDiscussionPhase();
      }, 2000);
    }
  }

  private startDiscussionPhase() {
    this.state.phase = GamePhase.DISCUSSION;
    this.state.discussionTimeRemaining = 60;
    
    this.broadcast("phaseChanged", { phase: GamePhase.DISCUSSION });
    
    this.discussionTimer = setInterval(() => {
      this.state.discussionTimeRemaining--;
      if (this.state.discussionTimeRemaining <= 0) {
        clearInterval(this.discussionTimer);
        this.startVotingPhase();
      }
    }, 1000);
  }

  private startVotingPhase() {
    this.state.phase = GamePhase.VOTING;
    this.state.votingTimeRemaining = 30;
    
    // Reset votes
    Array.from(this.state.players.values()).forEach(p => {
      p.hasVoted = false;
      p.votedFor = "";
    });
    this.state.voteCounts.clear();
    
    this.broadcast("phaseChanged", { phase: GamePhase.VOTING });
    
    this.votingTimer = setInterval(() => {
      this.state.votingTimeRemaining--;
      if (this.state.votingTimeRemaining <= 0) {
        clearInterval(this.votingTimer);
        this.processVotes();
      }
    }, 1000);
  }

  private checkVotingComplete() {
    const activePlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    const allVoted = activePlayers.every(p => p.hasVoted);
    
    if (allVoted) {
      clearInterval(this.votingTimer);
      this.processVotes();
    }
  }

  private processVotes() {
    // Find player with most votes
    let maxVotes = 0;
    let eliminatedId = "";
    
    this.state.voteCounts.forEach((count, sessionId) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = sessionId;
      }
    });
    
    if (eliminatedId) {
      const eliminated = this.state.players.get(eliminatedId);
      if (eliminated) {
        eliminated.isEliminated = true;
        this.state.eliminatedPlayerId = eliminatedId;
        
        // If Nucho was eliminated, team wins
        if (eliminated.isNucho) {
          this.endGame("team");
          return;
        }
      }
    }
    
    // Check if we should start final round
    const remainingPlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    if (remainingPlayers.length <= 3) {
      setTimeout(() => {
        this.startFinalRound();
      }, 3000);
    } else {
      setTimeout(() => {
        this.startNewRound();
      }, 3000);
    }
  }

  private startFinalRound() {
    this.clearAllTimers();
    this.state.phase = GamePhase.FINAL_ROUND;
    
    const remainingPlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    
    // Reset handshake states
    remainingPlayers.forEach(p => {
      p.finalHandshake = false;
      p.handshakeTarget = "";
    });
    
    this.broadcast("phaseChanged", { phase: GamePhase.FINAL_ROUND });
  }

  private checkFinalRoundComplete() {
    const remainingPlayers = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
    const nucho = remainingPlayers.find(p => p.isNucho);
    const nonNuchos = remainingPlayers.filter(p => !p.isNucho);
    
    if (!nucho) {
      this.endGame("team");
      return;
    }
    
    // Check if Nucho has handshaken with someone
    if (nucho.finalHandshake && nucho.handshakeTarget) {
      const target = this.state.players.get(nucho.handshakeTarget);
      if (target && !target.isEliminated) {
        // Nucho wins - gets all scores
        this.endGame("nucho");
        return;
      }
    }
    
    // Check if both non-Nuchos have handshaken with each other
    if (nonNuchos.length === 2) {
      const [p1, p2] = nonNuchos;
      if (p1.finalHandshake && p1.handshakeTarget === p2.sessionId &&
          p2.finalHandshake && p2.handshakeTarget === p1.sessionId) {
        // Team wins - share scores
        this.endGame("team");
        return;
      }
    }
  }

  private endGame(winner: "nucho" | "team") {
    this.clearAllTimers();
    this.state.phase = GamePhase.GAME_OVER;
    this.state.winner = winner;
    
    // Calculate final scores
    const allPlayers = Array.from(this.state.players.values());
    let totalScore = 0;
    
    allPlayers.forEach(p => {
      if (!p.isNucho) {
        totalScore += p.score;
      }
    });
    
    if (winner === "nucho") {
      const nucho = allPlayers.find(p => p.isNucho);
      if (nucho) {
        nucho.score = totalScore;
      }
    } else {
      // Team shares scores equally
      const teamPlayers = allPlayers.filter(p => !p.isNucho && !p.isEliminated);
      const sharePerPlayer = Math.floor(totalScore / teamPlayers.length);
      teamPlayers.forEach(p => {
        p.score = sharePerPlayer;
      });
    }
    
    this.broadcast("gameOver", { winner, scores: allPlayers.map(p => ({ id: p.sessionId, name: p.name, score: p.score, isNucho: p.isNucho })) });
  }

  private clearAllTimers() {
    if (this.discussionTimer) clearInterval(this.discussionTimer);
    if (this.votingTimer) clearInterval(this.votingTimer);
    if (this.triviaTimer) clearInterval(this.triviaTimer);
  }
}

