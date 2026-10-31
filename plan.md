# Counterfactual Boardroom — Implementation Plan

## Scope and decisions
Deliver a downloadable, runnable website prototype with separate frontend and backend source. The project follows the supplied backend PDF and architecture image, except the user's latest instruction replaces SQLite with PostgreSQL. Application source is limited to HTML, CSS, JavaScript, Python, and SQL. Python standard-library HTTP/API server and business services; plain browser JavaScript; PostgreSQL schema/seed/query SQL. No React, TypeScript, Node application server, or other application languages. AWS integrations are adapter boundaries only for later attachment; local usage must not require AWS credentials. A small pinned Python PostgreSQL driver may be declared as a runtime package, without changing the application language.

The product workflow covers Home portfolio, Decision Studio, Scenario Lab, Impact Map, Briefing Room, human approval, analytics, and audit history. The engines validate structured inputs and externally supplied estimates; they must not invent forecasts or let generated narrative become numerical authority. Predictions retain bounds, confidence, model/data lineage and versions. Assumptions and freshness are visible. Approval is role-checked and recorded. PostgreSQL is the sole persistence target.

## Architecture and project structure
- `frontend/`: `index.html`, `styles.css`, `app.js`, `briefing-notes.js`, and `data-actions.js`; responsive single-page interface with route-like tabs, decision tables, scenario comparisons, impact visualization, versioned human notes, CSV exports, and approval actions. No framework.
- `backend/main.py`: Python standard-library HTTP server, same-origin static asset serving, JSON API dispatch, bounded request bodies, and health route.
- `backend/api/`: Python route handlers for portfolio, decisions, scenarios, impacts, briefings, approvals, and audit.
- `backend/services/`: focused Python decision, scenario, impact, briefing, approval, and analytics engines.
- `backend/repositories/`: PostgreSQL persistence and query access.
- `backend/core/`: environment config, validation/errors, logging, security/role guards, AWS adapter boundaries.
- `backend/models/`: Python data shape/validation helpers.
- `backend/database/`: PostgreSQL `schema.sql`, `seed.sql`, and documented migration approach. Database initialization is explicit and safe to repeat.
- `backend/tests/`: Python standard-library tests for validation, workflow behavior, and SQL-oriented service contracts.
- `backend/scripts/`, `backend/deployment/`: Python/SQL/shell-free documentation/config placeholders where infrastructure is not yet attached; no invented credentials.
- `README.md`, `.env.example`, and this plan/TODO for run, configuration, boundaries, and structure.

## Serving and integration
Python serves the static frontend and JSON API on the configured port. The PostgreSQL URL is read only from environment configuration and never embedded in browser code or committed secrets. Provide clear setup commands for a local PostgreSQL database. AWS Bedrock/SageMaker/Lambda/S3/Step Functions/IAM/CloudWatch integrations are represented by isolated Python adapter interfaces and configuration placeholders, not fake credentials or hidden calls. A deterministic demo dataset demonstrates the workflow without fabricated AI outputs; any sample predictions are labeled illustrative and sourced as demo data.

## Design

**Three candidate directions:** restrained institutional slate-and-teal operations console (0.08); warm editorial strategy journal (0.06); high-contrast cyberpunk neon command center (0.04). Chosen: restrained institutional slate-and-teal operations console, retaining only a subtle teal/cyan technical motif from the reference image.

- **Design Movement:** contemporary enterprise decision-support console, borrowing the clarity of financial operations dashboards rather than sci-fi control panels.
- **Core Principles:** evidence before narrative; clear decision hierarchy; confidence and freshness always visible; compact but legible data density.
- **Color Philosophy:** warm off-white workspace and deep navy/charcoal navigation create calm authority; teal marks active analysis; green/amber/red indicate positive/caution/negative states, never decoration.
- **Layout Paradigm:** persistent left navigation with a broad work canvas, compact top context bar, and an asymmetric main column with an adjacent decision-insight rail.
- **Signature Elements:** decision status rail with stage markers; confidence/freshness chips beside metrics; scenario comparison rows with consistent baseline/counterfactual alignment.
- **Interaction Philosophy:** direct manipulation of decision records, explicit save/submit/approve actions, reversible scenario exploration, and visible explanations of data provenance.
- **Animation:** restrained 120–180 ms transitions for tab changes, drawers, and progress indicators; no looping decorative motion; respect reduced-motion preferences.
- **Typography System:** system sans-serif stack for clear enterprise UI; tabular numerals for metrics; distinct bold page titles and compact uppercase metadata labels.
- **Brand Essence:** a rehearsal room for consequential decisions before they reach the real organization; disciplined, transparent, practical.
- **Brand Voice:** concise and evidence-led. Example: “Modelled range, not a commitment.” “Approval remains with the accountable owner.”
- **Wordmark & Logo:** simple geometric split-path mark suggesting a decision branching into alternatives; text wordmark uses precise uppercase lettering.
- **Signature Brand Color:** muted deep teal, used sparingly for active/primary actions.
