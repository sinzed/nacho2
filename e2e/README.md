# End-to-End Tests

This directory contains Playwright end-to-end tests for the Nucho's Enigma game.

## Setup

1. Install Playwright browsers (required for first-time setup):
```bash
npx playwright install --with-deps chromium
```

Or install all browsers:
```bash
npx playwright install --with-deps
```

Note: This may require sudo permissions on Linux.

## Running Tests

- **Run all e2e tests**: `npm run test:e2e`
- **Run with UI mode** (interactive): `npm run test:e2e:ui`
- **Run in headed mode** (see browser): `npm run test:e2e:headed`
- **Run in debug mode**: `npm run test:e2e:debug`

## Test Coverage

The e2e tests cover:
- Room creation and room code display
- Player joining rooms
- Player list synchronization (creator visible to first joiner)
- Multiple players joining and seeing each other
- UI state validation (player counts, buttons, etc.)

## Configuration

Tests are configured in `playwright.config.ts`. The configuration automatically:
- Starts the server (port 2567) and client (port 3000) before tests
- Runs tests in parallel across multiple browsers
- Generates HTML reports for test results

