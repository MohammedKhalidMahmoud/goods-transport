# Tests (foundation)

Phase 1 leaves this folder **ready** for Phase 2+ automated tests.

Suggested layout (add when you start testing):

```
tests/
├── README.md           (this file)
├── unit/               # Pure functions, helpers
├── integration/        # HTTP + test DB (e.g. supertest)
└── fixtures/           # Shared seed snippets / JSON
```

Run commands (to be wired in `package.json` when a runner is added):

- Prefer **integration** tests against a dedicated MySQL schema (e.g. `goods_transfer_test`).
- Reset DB with `npx prisma migrate deploy` + minimal seed per suite.

No test runner is configured in Phase 1 to avoid empty placeholder suites.
