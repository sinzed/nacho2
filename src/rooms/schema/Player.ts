import { Schema, type, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("boolean") isNucho: boolean = false;
  @type("number") score: number = 0;
  @type("boolean") isEliminated: boolean = false;
  @type("boolean") hasVoted: boolean = false;
  @type("string") votedFor: string = ""; // sessionId of player voted for
  @type("number") triviaAnswers: number = 0; // correct answers in trivia
  @type("boolean") hasAnsweredQuestionnaire: boolean = false;
  @type("boolean") hasAnsweredTrivia: boolean = false;
  @type("boolean") finalHandshake: boolean = false; // for final round
  @type("string") handshakeTarget: string = ""; // who they want to handshake with
}

