# Project structure

```text
counterfactual_boardroom/
├── frontend/
│   ├── index.html                # Dashboard shell and navigation
│   ├── styles.css                # Responsive visual system
│   └── app.js                    # Vanilla JS pages, interactions, and API client
│   ├── briefing-notes.js         # Versioned human notes in the briefing workflow
│   └── data-actions.js           # Portfolio/audit CSV exports and impact refresh
├── public/manus-routes.json      # Website route declaration
├── backend/
│   ├── main.py                   # Python HTTP server + static assets + JSON API
│   ├── api/                      # Route façade modules and shared router
│   ├── core/                     # Configuration, validation, security, store, fixtures
│   ├── models/                   # Python decision/scenario/impact/briefing/approval shapes
│   ├── services/                 # Decision, scenario, impact, briefing, approval, analytics engines
│   ├── repositories/             # PostgreSQL repository boundary
│   ├── integrations/             # Fail-closed Bedrock/SageMaker/S3/Step Functions adapters
│   ├── database/
│   │   ├── schema.sql            # PostgreSQL relational schema
│   │   ├── seed.sql              # Repeatable synthetic demo data
│   │   └── README.md             # PostgreSQL bootstrap guidance
│   ├── utils/                    # Freshness, bounds, and helper routines
│   ├── scripts/                  # Python PostgreSQL initializer and report helper
│   ├── tests/                    # Python unit tests
│   ├── deployment/README.md      # Later AWS attachment guide
│   └── requirements.txt          # psycopg 3 Python driver only
├── main.py                       # Root run entry point
├── README.md
├── plan.md
└── TODO.md
```

### API overview
`GET /api/health`, `/api/portfolio`, `/api/decisions`, `/api/scenarios`, `/api/impacts`, `/api/briefings`, `/api/approvals`, and `/api/audit`; `POST /api/decisions`, `/api/decisions/{id}/scenarios`, `/api/briefings`, `/api/briefings/demo/submit`, and `/api/approvals`. Human-note writes are enabled for the in-memory demo; PostgreSQL writes remain disabled until a trusted identity adapter is attached.
