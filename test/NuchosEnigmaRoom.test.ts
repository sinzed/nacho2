import { ColyseusTestServer, boot } from "@colyseus/testing";
import appConfig from "../src/app.config";
import { GameState } from "../src/rooms/schema/GameState";

describe("Nucho's Enigma Room Tests", () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot(appConfig);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  beforeEach(async () => {
    await colyseus.cleanup();
  });

  test("should show creator in player list when they create room", async () => {
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", { name: "CreatorPlayer" });

    const client1 = await colyseus.connectTo(room, { name: "CreatorPlayer" });

    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();

    expect(client1.state.players).toBeDefined();
    expect(client1.state.players.size).toBe(1);

    const creatorPlayer = Array.from(client1.state.players.values())[0];
    expect(creatorPlayer.name).toBe("CreatorPlayer");
    expect(creatorPlayer.sessionId).toBe(client1.sessionId);
  });

  test("should show all players to second player when they join", async () => {
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", { name: "CreatorPlayer" });
    const client1 = await colyseus.connectTo(room, { name: "CreatorPlayer" });

    await room.waitForNextPatch();
    expect(client1.state.players.size).toBe(1);

    const client2 = await colyseus.connectTo(room, { name: "SecondPlayer" });

    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();

    expect(client2.state.players.size).toBe(2);
    const playerNames = Array.from(client2.state.players.values()).map(p => p.name);
    expect(playerNames).toEqual(expect.arrayContaining(["CreatorPlayer", "SecondPlayer"]));

    await room.waitForNextPatch();
    const playerNamesInClient1 = Array.from(client1.state.players.values()).map(p => p.name);
    expect(playerNamesInClient1).toEqual(expect.arrayContaining(["CreatorPlayer", "SecondPlayer"]));
  });

  test("should synchronize player list to all clients when new player joins", async () => {
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", { name: "Player1" });
    const client1 = await colyseus.connectTo(room, { name: "Player1" });

    await room.waitForNextPatch();
    expect(client1.state.players.size).toBe(1);

    const client2 = await colyseus.connectTo(room, { name: "Player2" });
    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();
    expect(client1.state.players.size).toBe(2);
    expect(client2.state.players.size).toBe(2);

    const client3 = await colyseus.connectTo(room, { name: "Player3" });
    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();

    expect(client1.state.players.size).toBe(3);
    expect(client2.state.players.size).toBe(3);
    expect(client3.state.players.size).toBe(3);

    const allPlayerNames = ["Player1", "Player2", "Player3"];
    [client1, client2, client3].forEach((client) => {
      const names = Array.from(client.state.players.values()).map(p => p.name);
      allPlayerNames.forEach(name => expect(names).toContain(name));
    });
  });

  test("should have correct room code", async () => {
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", { name: "TestPlayer" });
    const client = await colyseus.connectTo(room, { name: "TestPlayer" });

    await room.waitForNextPatch();
    expect(room.roomId).toBeDefined();
    expect(typeof room.roomId).toBe("string");
  });
});
