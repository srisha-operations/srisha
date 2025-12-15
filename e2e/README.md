Playwright E2E tests for SRISHA project

Prerequisites:
- Node.js
- Run `npm install` to install dependencies
- Playwright browsers must be installed with `npx playwright install`

Run the tests:

```bash
# Start the dev server (Playwright will start in tests as a webServer by default)
npm run dev

# Run all e2e tests
npm run e2e

# Run a specific project (e.g., chromium)
npx playwright test --project=chromium
```

Notes:
- Tests rely on seeded products and may require API data. Tests use guest checkout flow.
- If you run the test on a machine where the default dev server port is in use, ensure `PORT=5173` or change `baseURL` in `playwright.config.ts`.
