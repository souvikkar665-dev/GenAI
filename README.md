# The Counterfactual Boardroom — backend prototype

A local, backend-first prototype of the supplied architecture. Implemented code is limited to the six backend engines under `backend/services/` and SQLite schema/seed SQL under `backend/database/`. Other architecture listings are represented by folders and `PLACEHOLDER.md` files; the frontend is intentionally a placeholder.

## Included
- Decision, scenario, impact, briefing, approval, and analytics engines (Python, SQLite).
- Relational schema, constraints, indexes, audit history, versioned scenarios/results, and demo seed data.
- Small runnable demo entry point: `backend/demo.py`.

## Run
Requires Python 3.10+ and no third-party packages.

```bash
cd backend
python demo.py
```
The demo creates `database/boardroom.db` and prints a sample portfolio summary. Remove that generated file to reset the demo database. The SQL database itself is initialized from `database/schema.sql` and `database/seed.sql`.

## Prototype boundaries
This is an educational/local prototype, not production AWS deployment. Bedrock and SageMaker calls are not made; model numbers must be explicitly provided to the scenario engine. The sample response is clearly labeled as a prototype estimate. Authentication, tenant security, API Gateway/Lambda deployment, secrets, real model integration, and production migration/backup procedures remain unimplemented. Human approval is explicit and role-checked in the approval engine.
