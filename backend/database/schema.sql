-- PostgreSQL schema for Counterfactual Boardroom. No SQLite compatibility layer.
BEGIN;
CREATE TABLE IF NOT EXISTS organizations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id), email TEXT NOT NULL,
 name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('Admin','Decision Owner','Analyst','Approver','Viewer')),
 active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(organization_id,email)
);
CREATE TABLE IF NOT EXISTS decisions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id),
 title VARCHAR(140) NOT NULL, original_question TEXT NOT NULL, change_description TEXT NOT NULL, objective TEXT NOT NULL,
 time_horizon TEXT NOT NULL, business_unit TEXT NOT NULL DEFAULT 'Corporate', status TEXT NOT NULL DEFAULT 'draft'
 CHECK(status IN ('draft','ready','simulated','in_review','approved','rejected','archived')),
 created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS decision_constraints (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
 description TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'required', UNIQUE(decision_id,description)
);
CREATE TABLE IF NOT EXISTS metrics (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id),
 name TEXT NOT NULL, unit TEXT NOT NULL, business_min NUMERIC, business_max NUMERIC, definition TEXT NOT NULL DEFAULT '', UNIQUE(organization_id,name)
);
CREATE TABLE IF NOT EXISTS decision_metrics (
 decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE, metric_id UUID NOT NULL REFERENCES metrics(id),
 PRIMARY KEY(decision_id,metric_id)
);
CREATE TABLE IF NOT EXISTS data_sources (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id),
 name TEXT NOT NULL, source_type TEXT NOT NULL, freshness_at TIMESTAMPTZ, quality_status TEXT NOT NULL DEFAULT 'unknown'
 CHECK(quality_status IN ('unknown','good','warning','stale','invalid')), metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS scenarios (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
 name TEXT NOT NULL, scenario_type TEXT NOT NULL CHECK(scenario_type IN ('Baseline','Counterfactual','Recommended')),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','queued','running','completed','failed','needs_review')),
 version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_by UUID REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS scenario_variables (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
 name TEXT NOT NULL, baseline_value TEXT, changed_value TEXT, unit TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'user',
 UNIQUE(scenario_id,name,changed_value)
);
CREATE TABLE IF NOT EXISTS assumptions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
 description TEXT NOT NULL, value TEXT, source_type TEXT NOT NULL DEFAULT 'inferred',
 status TEXT NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','verified','stale','expired')),
 confidence NUMERIC CHECK(confidence IS NULL OR (confidence BETWEEN 0 AND 1)), expires_at TIMESTAMPTZ, verified_by UUID REFERENCES users(id), verified_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS model_runs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
 model_name TEXT NOT NULL, model_version TEXT NOT NULL, data_snapshot TEXT NOT NULL, training_period TEXT,
 generated_at TIMESTAMPTZ NOT NULL DEFAULT now(), run_status TEXT NOT NULL DEFAULT 'completed'
 CHECK(run_status IN ('queued','running','completed','failed','needs_review')), error_reason TEXT
);
CREATE TABLE IF NOT EXISTS predictions (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
 metric_id UUID NOT NULL REFERENCES metrics(id), value NUMERIC, lower_bound NUMERIC, upper_bound NUMERIC,
 unit TEXT NOT NULL, confidence NUMERIC CHECK(confidence IS NULL OR (confidence BETWEEN 0 AND 1)),
 availability TEXT NOT NULL DEFAULT 'available' CHECK(availability IN ('available','unavailable')),
 CHECK(lower_bound IS NULL OR upper_bound IS NULL OR lower_bound <= upper_bound),
 CHECK(availability='unavailable' OR value BETWEEN lower_bound AND upper_bound),
 CHECK(availability='unavailable' OR (value IS NOT NULL AND lower_bound IS NOT NULL AND upper_bound IS NOT NULL)),
 UNIQUE(model_run_id,metric_id)
);
CREATE TABLE IF NOT EXISTS impacts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
 metric_id UUID REFERENCES metrics(id), name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'operational',
 direction TEXT NOT NULL CHECK(direction IN ('positive','negative','neutral','uncertain')),
 magnitude_band TEXT NOT NULL DEFAULT 'unknown', confidence NUMERIC CHECK(confidence IS NULL OR confidence BETWEEN 0 AND 1),
 explanation TEXT NOT NULL DEFAULT '', owner TEXT, measurement_requirement TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS impact_relationships (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, from_impact_id UUID NOT NULL REFERENCES impacts(id) ON DELETE CASCADE,
 to_impact_id UUID NOT NULL REFERENCES impacts(id) ON DELETE CASCADE, relationship TEXT NOT NULL DEFAULT 'may_affect',
 UNIQUE(from_impact_id,to_impact_id)
);
CREATE TABLE IF NOT EXISTS briefings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
 scenario_id UUID REFERENCES scenarios(id), version INTEGER NOT NULL DEFAULT 1, executive_summary TEXT NOT NULL DEFAULT '',
 human_notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','rejected','changes_requested')),
 created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(decision_id,version)
);
CREATE TABLE IF NOT EXISTS approvals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
 briefing_id UUID REFERENCES briefings(id), actor_id UUID NOT NULL REFERENCES users(id), action TEXT NOT NULL
 CHECK(action IN ('requested','approved','rejected','change_requested')), comment TEXT NOT NULL DEFAULT '',
 idempotency_key TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS measurement_plans (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
 metric_id UUID NOT NULL REFERENCES metrics(id), target_value NUMERIC, observation_date DATE, owner TEXT,
 trigger_condition TEXT NOT NULL DEFAULT '', outcome_value NUMERIC,
 status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','due','recorded','cancelled'))
);
CREATE TABLE IF NOT EXISTS audit_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id), actor_id UUID REFERENCES users(id),
 entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
 event_key TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), decision_id UUID NOT NULL REFERENCES decisions(id), scenario_id UUID REFERENCES scenarios(id),
 state TEXT NOT NULL CHECK(state IN ('Queued','Preparing data','Checking freshness','Running model','Explaining results','Building impact map','Saving results','Completed','Failed','Needs review')),
 progress_message TEXT NOT NULL DEFAULT '', error_reason TEXT, idempotency_key TEXT UNIQUE, attempt INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decisions_org_status ON decisions(organization_id,status);
CREATE INDEX IF NOT EXISTS idx_scenarios_decision_created ON scenarios(decision_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_run_metric ON predictions(model_run_id,metric_id);
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_events(organization_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_decision_time ON approvals(decision_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_state_time ON jobs(state,created_at);
COMMIT;
