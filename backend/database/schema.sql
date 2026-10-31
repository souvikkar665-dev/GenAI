PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin','Decision Owner','Analyst','Approver','Viewer')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    title TEXT NOT NULL,
    original_question TEXT NOT NULL,
    change_description TEXT NOT NULL,
    objective TEXT NOT NULL,
    time_horizon TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','simulated','in_review','approved','rejected','archived')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS decision_constraints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    business_min REAL,
    business_max REAL,
    UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS decision_metrics (
    decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id),
    PRIMARY KEY(decision_id, metric_id)
);
CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'manual',
    freshness_at TEXT,
    quality_status TEXT NOT NULL DEFAULT 'unknown',
    metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scenario_type TEXT NOT NULL CHECK(scenario_type IN ('Baseline','Counterfactual','Recommended')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','queued','running','completed','failed','needs_review')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS scenario_variables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    baseline_value TEXT,
    changed_value TEXT,
    unit TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'user'
);
CREATE TABLE IF NOT EXISTS assumptions (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value TEXT,
    source_type TEXT NOT NULL DEFAULT 'inferred',
    status TEXT NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','verified','stale','expired')),
    confidence REAL CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    expires_at TEXT
);
CREATE TABLE IF NOT EXISTS model_runs (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    data_snapshot TEXT NOT NULL,
    training_period TEXT,
    generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    run_status TEXT NOT NULL DEFAULT 'completed'
);
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_run_id TEXT NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id),
    value REAL,
    lower_bound REAL,
    upper_bound REAL,
    unit TEXT NOT NULL,
    confidence REAL CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    availability TEXT NOT NULL DEFAULT 'available' CHECK(availability IN ('available','unavailable')),
    CHECK (lower_bound IS NULL OR upper_bound IS NULL OR lower_bound <= upper_bound)
);
CREATE TABLE IF NOT EXISTS impacts (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    metric_id TEXT REFERENCES metrics(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'operational',
    direction TEXT NOT NULL CHECK(direction IN ('positive','negative','neutral','uncertain')),
    magnitude_band TEXT NOT NULL DEFAULT 'unknown',
    confidence REAL CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    explanation TEXT NOT NULL DEFAULT '',
    owner TEXT,
    measurement_requirement TEXT
);
CREATE TABLE IF NOT EXISTS impact_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_impact_id TEXT NOT NULL REFERENCES impacts(id) ON DELETE CASCADE,
    to_impact_id TEXT NOT NULL REFERENCES impacts(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'may_affect',
    UNIQUE(from_impact_id, to_impact_id)
);
CREATE TABLE IF NOT EXISTS briefings (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    scenario_id TEXT REFERENCES scenarios(id),
    version INTEGER NOT NULL DEFAULT 1,
    executive_summary TEXT NOT NULL DEFAULT '',
    human_notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','rejected','changes_requested')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(decision_id, version)
);
CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    briefing_id TEXT REFERENCES briefings(id),
    actor_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL CHECK(action IN ('requested','approved','rejected','change_requested')),
    comment TEXT NOT NULL DEFAULT '',
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS measurement_plans (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id),
    target_value REAL,
    observation_date TEXT,
    owner TEXT,
    trigger_condition TEXT NOT NULL DEFAULT '',
    outcome_value REAL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','due','recorded','cancelled'))
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    actor_id TEXT REFERENCES users(id),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES decisions(id),
    scenario_id TEXT REFERENCES scenarios(id),
    state TEXT NOT NULL CHECK(state IN ('Queued','Preparing data','Checking freshness','Running model','Explaining results','Building impact map','Saving results','Completed','Failed','Needs review')),
    progress_message TEXT NOT NULL DEFAULT '',
    error_reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_decisions_org_status ON decisions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_scenarios_decision ON scenarios(decision_id);
CREATE INDEX IF NOT EXISTS idx_predictions_run ON predictions(model_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_logs(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_approvals_decision ON approvals(decision_id, created_at);
