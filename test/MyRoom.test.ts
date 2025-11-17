import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";
import { MyRoomState } from "../src/rooms/schema/MyRoomState";

describe("testing your Colyseus app", () => {
  let colyseus: ColyseusTestServer;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("connecting into a room", async () => {
    // This test is for the old MyRoom which no longer exists
    // Skipping this test as we're now using NuchosEnigmaRoom
    // See NuchosEnigmaRoom.test.ts for active tests
    assert.ok(true, "MyRoom test skipped - using NuchosEnigmaRoom instead");
  });
});
