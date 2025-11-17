import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";
import { GameState } from "../src/rooms/schema/GameState";

describe("Nucho's Enigma Room Tests", () => {
  let colyseus: ColyseusTestServer;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("should show creator in player list when they create room", async () => {
    // Create a room with first player (creator)
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", {
      name: "CreatorPlayer"
    });

    // Connect first client
    const client1 = await colyseus.connectTo(room, {
      name: "CreatorPlayer"
    });

    // Wait for state sync - give it time for onJoin to complete
    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();

    // Verify creator is in the player list
    assert.ok(client1.state.players, "Players map should exist");
    assert.strictEqual(client1.state.players.size, 1, "Creator should be in player list");
    const creatorPlayer = Array.from(client1.state.players.values())[0];
    assert.strictEqual(creatorPlayer.name, "CreatorPlayer", "Creator name should match");
    assert.strictEqual(creatorPlayer.sessionId, client1.sessionId, "Creator sessionId should match");
  });

  it("should show all players to second player when they join", async () => {
    // Create a room with first player (creator)
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", {
      name: "CreatorPlayer"
    });

    // Connect first client (creator)
    const client1 = await colyseus.connectTo(room, {
      name: "CreatorPlayer"
    });

    // Wait for state sync
    await room.waitForNextPatch();

    // Verify creator is in the list
    assert.strictEqual(client1.state.players.size, 1, "Creator should be in player list");

    // Connect second client
    const client2 = await colyseus.connectTo(room, {
      name: "SecondPlayer"
    });

    // Wait for state sync - give it a bit more time for the join to complete
    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for onJoin to complete
    await room.waitForNextPatch();

    // Verify second player can see both players
    assert.strictEqual(client2.state.players.size, 2, "Second player should see 2 players");
    
    const playersInClient2 = Array.from(client2.state.players.values());
    const playerNames = playersInClient2.map(p => p.name);
    
    assert.ok(
      playerNames.includes("CreatorPlayer"),
      "Second player should see CreatorPlayer in the list"
    );
    assert.ok(
      playerNames.includes("SecondPlayer"),
      "Second player should see themselves in the list"
    );

    // Verify creator can also see both players
    await room.waitForNextPatch();
    assert.strictEqual(client1.state.players.size, 2, "Creator should see 2 players");
    
    const playersInClient1 = Array.from(client1.state.players.values());
    const playerNamesInClient1 = playersInClient1.map(p => p.name);
    
    assert.ok(
      playerNamesInClient1.includes("CreatorPlayer"),
      "Creator should see themselves in the list"
    );
    assert.ok(
      playerNamesInClient1.includes("SecondPlayer"),
      "Creator should see SecondPlayer in the list"
    );
  });

  it("should synchronize player list to all clients when new player joins", async () => {
    // Create a room
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", {
      name: "Player1"
    });

    // Connect first client
    const client1 = await colyseus.connectTo(room, {
      name: "Player1"
    });

    await room.waitForNextPatch();
    assert.strictEqual(client1.state.players.size, 1, "Should have 1 player initially");

    // Connect second client
    const client2 = await colyseus.connectTo(room, {
      name: "Player2"
    });

    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();

    // Both clients should see 2 players
    assert.strictEqual(client1.state.players.size, 2, "Client1 should see 2 players");
    assert.strictEqual(client2.state.players.size, 2, "Client2 should see 2 players");

    // Connect third client
    const client3 = await colyseus.connectTo(room, {
      name: "Player3"
    });

    await room.waitForNextPatch();
    await new Promise(resolve => setTimeout(resolve, 200));
    await room.waitForNextPatch();

    // All clients should see 3 players
    assert.strictEqual(client1.state.players.size, 3, "Client1 should see 3 players");
    assert.strictEqual(client2.state.players.size, 3, "Client2 should see 3 players");
    assert.strictEqual(client3.state.players.size, 3, "Client3 should see 3 players");

    // Verify all players are in each client's view
    const allPlayerNames = ["Player1", "Player2", "Player3"];
    
    [client1, client2, client3].forEach((client, index) => {
      const players = Array.from(client.state.players.values());
      const names = players.map(p => p.name);
      
      allPlayerNames.forEach(expectedName => {
        assert.ok(
          names.includes(expectedName),
          `Client${index + 1} should see ${expectedName}`
        );
      });
    });
  });

  it("should have correct room code", async () => {
    const room = await colyseus.createRoom<GameState>("nuchos_enigma", {
      name: "TestPlayer"
    });

    const client = await colyseus.connectTo(room, {
      name: "TestPlayer"
    });

    await room.waitForNextPatch();

    // Room code should be set and non-empty
    assert.ok(client.state.roomCode, "Room code should be set");
    assert.strictEqual(typeof client.state.roomCode, "string", "Room code should be a string");
    assert.ok(client.state.roomCode.length > 0, "Room code should not be empty");
  });
});

