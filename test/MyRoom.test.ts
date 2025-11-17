import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";

describe("testing your Colyseus app", () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => colyseus = await boot(appConfig));
  afterAll(async () => await colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  test("connecting into a room", () => {
    // This test is for the old MyRoom which no longer exists
    // Skipping this test as we're now using NuchosEnigmaRoom
    // See NuchosEnigmaRoom.test.ts for active tests
    expect(true).toBe(true);
  });
});
