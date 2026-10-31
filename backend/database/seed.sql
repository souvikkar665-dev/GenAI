-- Synthetic demo rows for first-run review only. Numeric figures are illustrative and not forecasts.
INSERT INTO organizations(id,name) VALUES ('00000000-0000-4000-8000-000000000001','Northstar Group') ON CONFLICT(id) DO NOTHING;
INSERT INTO users(id,organization_id,email,name,role) VALUES
('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','alex.morgan@example.test','Alex Morgan','Decision Owner'),
('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001','jamie.lee@example.test','Jamie Lee','Approver'),
('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000001','sam.rivera@example.test','Sam Rivera','Approver') ON CONFLICT(id) DO NOTHING;
INSERT INTO metrics(id,organization_id,name,unit,definition) VALUES
('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001','Revenue','USD','Revenue during first 60 days after launch.'),
('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000001','Support volume','tickets','Support tickets during first 60 days after launch.'),
('00000000-0000-4000-8000-000000000023','00000000-0000-4000-8000-000000000001','Staffing load','hours','Support staffing hours during launch window.'),
('00000000-0000-4000-8000-000000000024','00000000-0000-4000-8000-000000000001','Customer satisfaction','score','Post-launch customer satisfaction index.') ON CONFLICT(id) DO NOTHING;
INSERT INTO decisions(id,organization_id,title,original_question,change_description,objective,time_horizon,business_unit,status,created_by) VALUES
('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000001','Regional launch timing — Northstar West','What if we delay the regional launch by two weeks?','Move Northstar West launch by 14 days.','Reduce first-wave support overload while protecting customer satisfaction and Q4 revenue timing.','First 60 days after launch','Customer Operations','in_review','00000000-0000-4000-8000-000000000011'),
('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000001','Weekend support coverage — service scale-up','Should we add weekend coverage for the first four weeks?','Add two weekend support shifts for four weeks.','Keep urgent ticket backlog within the service threshold.','First 30 days after rollout','Operations','ready','00000000-0000-4000-8000-000000000011') ON CONFLICT(id) DO NOTHING;
INSERT INTO decision_constraints(decision_id,description) VALUES
('00000000-0000-4000-8000-000000000031','Q4 revenue plan'),('00000000-0000-4000-8000-000000000031','Customer satisfaction ≥ 82'),('00000000-0000-4000-8000-000000000031','Support capacity ≤ 6,000 tickets'),
('00000000-0000-4000-8000-000000000032','Overtime budget ≤ $42,000'),('00000000-0000-4000-8000-000000000032','Response time ≤ 4 hours') ON CONFLICT DO NOTHING;
INSERT INTO decision_metrics(decision_id,metric_id) VALUES
('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000021'),('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000022'),('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000023'),('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000024') ON CONFLICT DO NOTHING;
INSERT INTO scenarios(id,decision_id,name,scenario_type,status,version) VALUES
('00000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000031','On-time launch','Baseline','completed',1),
('00000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000031','14-day delay','Counterfactual','completed',1),
('00000000-0000-4000-8000-000000000043','00000000-0000-4000-8000-000000000031','On time + added support','Counterfactual','completed',1) ON CONFLICT(id) DO NOTHING;
INSERT INTO scenario_variables(scenario_id,name,baseline_value,changed_value,unit,source) VALUES
('00000000-0000-4000-8000-000000000042','Launch delay','0','14','days','illustrative seed assumption'),
('00000000-0000-4000-8000-000000000043','Additional launch-week support shifts','0','2','shifts','illustrative seed assumption') ON CONFLICT DO NOTHING;
INSERT INTO assumptions(id,scenario_id,description,source_type,status,confidence) VALUES
('00000000-0000-4000-8000-000000000051','00000000-0000-4000-8000-000000000042','Demand remains stable through revised launch window','demo','unverified',.70),
('00000000-0000-4000-8000-000000000052','00000000-0000-4000-8000-000000000042','Regional support training completes before launch','demo','unverified',.80) ON CONFLICT(id) DO NOTHING;
INSERT INTO model_runs(id,scenario_id,model_name,model_version,data_snapshot,training_period) VALUES
('00000000-0000-4000-8000-000000000061','00000000-0000-4000-8000-000000000041','synthetic-demo','demo-0.1','illustrative-2026-10','NOT A TRAINED MODEL'),
('00000000-0000-4000-8000-000000000062','00000000-0000-4000-8000-000000000042','synthetic-demo','demo-0.1','illustrative-2026-10','NOT A TRAINED MODEL') ON CONFLICT(id) DO NOTHING;
INSERT INTO predictions(model_run_id,metric_id,value,lower_bound,upper_bound,unit,confidence,availability) VALUES
('00000000-0000-4000-8000-000000000061','00000000-0000-4000-8000-000000000021',5000000,4800000,5200000,'USD',.76,'available'),
('00000000-0000-4000-8000-000000000061','00000000-0000-4000-8000-000000000022',6300,6100,6500,'tickets',.73,'available'),
('00000000-0000-4000-8000-000000000062','00000000-0000-4000-8000-000000000021',4800000,4600000,5000000,'USD',.74,'available'),
('00000000-0000-4000-8000-000000000062','00000000-0000-4000-8000-000000000022',5550,5350,5750,'tickets',.74,'available') ON CONFLICT (model_run_id,metric_id) DO NOTHING;
INSERT INTO impacts(id,scenario_id,metric_id,name,category,direction,magnitude_band,confidence,explanation,owner,measurement_requirement) VALUES
('00000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000022','Support capacity','operations','positive','moderate',.81,'Synthetic demo relationship; validate against observed tickets.','Customer Operations','Review launch-week ticket volume on 03 Nov.'),
('00000000-0000-4000-8000-000000000072','00000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000021','Revenue timing','financial','negative','small',.74,'Illustrative timing shift; not a lost-sales estimate.','Finance','Reconcile first 60-day realized revenue.') ON CONFLICT(id) DO NOTHING;
INSERT INTO approvals(id,decision_id,actor_id,action,comment) VALUES
('00000000-0000-4000-8000-000000000081','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000011','requested','Demo approval request; synthetic figures require review.') ON CONFLICT(id) DO NOTHING;
INSERT INTO audit_events(organization_id,actor_id,entity_type,entity_id,action,description,event_key) VALUES
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','decision','00000000-0000-4000-8000-000000000031','created','Demo decision created; all attached prediction values are synthetic illustrative fixtures.','demo-seed-decision-created'),
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','scenario','00000000-0000-4000-8000-000000000042','simulated','Synthetic demo model run only; no SageMaker endpoint was called.','demo-seed-scenario-simulated') ON CONFLICT(event_key) DO NOTHING;
