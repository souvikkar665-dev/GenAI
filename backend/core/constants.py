"""Business vocabulary shared across Python route and workflow modules."""
ROLES=('Admin','Decision Owner','Analyst','Approver','Viewer')
DECISION_STATES=('draft','ready','simulated','in_review','approved','rejected','archived')
JOB_STATES=('Queued','Preparing data','Checking freshness','Running model','Explaining results','Building impact map','Saving results','Completed','Failed','Needs review')
