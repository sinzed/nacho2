import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";
import { Question } from "./Question";

export enum GamePhase {
  LOBBY = "lobby",
  QUESTIONNAIRE = "questionnaire",
  TRIVIA = "trivia",
  DISCUSSION = "discussion",
  VOTING = "voting",
  ELIMINATION = "elimination",
  FINAL_ROUND = "final_round",
  GAME_OVER = "game_over"
}

export class GameState extends Schema {
  @type("string") phase: string = GamePhase.LOBBY;
  @type("number") round: number = 1;
  @type({ map: Player }) players: MapSchema<Player> = new MapSchema<Player>();
  @type({ array: Question }) questionnaireQuestions: ArraySchema<Question> = new ArraySchema<Question>();
  @type({ array: Question }) triviaQuestions: ArraySchema<Question> = new ArraySchema<Question>();
  @type("number") currentQuestionIndex: number = 0;
  @type("number") discussionTimeRemaining: number = 60; // seconds
  @type("number") votingTimeRemaining: number = 30; // seconds
  @type("string") nuchoSessionId: string = "";
  @type("string") eliminatedPlayerId: string = "";
  @type("string") winner: string = ""; // "nucho" or "team"
  @type({ map: "number" }) voteCounts: MapSchema<number> = new MapSchema<number>();
  @type("string") roomCode: string = "";
}

