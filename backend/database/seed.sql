INSERT OR IGNORE INTO organizations(id, name) VALUES ('org-demo', 'Demo Organization');
INSERT OR IGNORE INTO users(id, organization_id, name, role) VALUES
 ('user-owner','org-demo','Avery Owner','Decision Owner'),
 ('user-analyst','org-demo','Jordan Analyst','Analyst'),
 ('user-approver','org-demo','Morgan Approver','Approver');
INSERT OR IGNORE INTO metrics(id, organization_id, name, unit, business_min, business_max) VALUES
 ('metric-revenue','org-demo','Revenue','USD',0,NULL),
 ('metric-support','org-demo','Support volume','tickets',0,NULL),
 ('metric-staffing','org-demo','Staffing load','hours',0,NULL),
 ('metric-satisfaction','org-demo','Customer satisfaction','score',0,100);
INSERT OR IGNORE INTO data_sources(id, organization_id, name, source_type, freshness_at, quality_status)
VALUES ('source-demo','org-demo','Demonstration inputs','manual',CURRENT_TIMESTAMP,'demo');
