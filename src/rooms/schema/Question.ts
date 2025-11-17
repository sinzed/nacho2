import { Schema, type, ArraySchema } from "@colyseus/schema";

export class Question extends Schema {
  @type("string") id: string = "";
  @type("string") text: string = "";
  @type("string") type: string = ""; // "questionnaire" or "trivia"
  @type("string") correctAnswer: string = ""; // for trivia
  @type({ array: "string" }) options: ArraySchema<string> = new ArraySchema<string>();
  @type("string") nuchoAnswer: string = ""; // pre-filled answer for Nucho
}

