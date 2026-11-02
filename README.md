# The Counterfactual Boardroom

A practical executive decision-support prototype for structured decisions, counterfactual scenario comparison, impact mapping, briefing, and human approval. The interface follows the supplied boardroom architecture while presenting a quieter enterprise dashboard suited to real operations work.

## Scope and technology boundary

Application code is limited to **HTML, CSS, JavaScript, Python, and SQL**, with **PostgreSQL** as the only database target. There is no React, TypeScript, Node application server, or SQLite code. The local out-of-box demo keeps sample records in process memory and creates no database file. PostgreSQL persistence activates only when `BOARDROOM_POSTGRES_DSN` is configured.


## Enable PostgreSQL persistence

1. Create a PostgreSQL database and use an appropriately restricted database role.
2. Install the PostgreSQL Python driver with `python3 -m pip install -r backend/requirements.txt`.
3. Set `BOARDROOM_POSTGRES_DSN` in the process environment; do not put a real connection string in source or the ZIP.
4. Apply `backend/database/schema.sql`, then `backend/database/seed.sql`, using your approved PostgreSQL tooling. `python3 backend/scripts/initialize_database.py` is also provided for an explicitly configured connection.
5. Start with `python3 main.py`.

The seed is repeatable and contains synthetic demonstration ranges, not forecasts from a trained model. Do not use it to make a live business decision. Human-note versions, scenario and decision writes, and CSV exports work in memory demo mode; all demo changes reset when the Python process restarts. The API refuses briefing writes and final approval actions in PostgreSQL mode until a trusted server-side identity provider has been attached. The demo role selector is intentionally only a UI demonstration and is not production authentication.

## Product workflow

- **Overview** summarizes portfolio activity, confidence, approvals, freshness, assumptions, and measurements due.
- **Decision Studio** captures the original question, objective, constraints, time horizon, business unit, and metrics before simulation.
- **Scenario Lab** compares a baseline with counterfactual branches and exposes sample ranges, source/model lineage, confidence, and assumptions.
- **Impact Map** relates potential consequences to affected teams and measurements; causal links are hypotheses, not proof.
- **Briefing Room** distinguishes observed inputs, modeled estimates, assumptions, and human judgment.
- **Approvals** enforces a human approver in the demo and appends activity. PostgreSQL final approval remains locked until server-authenticated roles are connected.
- **Audit trail** shows retained activity rather than overwriting previous model runs.

## Backend and AWS boundaries

The Python service validates inputs before persistence and adapter calls. PostgreSQL SQL stores decisions, constraints, scenarios, variables, assumptions, model runs, predictions, impacts, briefing versions, approvals, measurement plans, jobs, and audit events. Prediction records require numeric values, bounds, confidence, model version, and data snapshot; unavailable metrics stay unavailable.

