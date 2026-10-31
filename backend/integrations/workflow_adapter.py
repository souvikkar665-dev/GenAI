"""Step Functions/Lambda boundary; local prototype exposes status but starts no cloud job."""
JOB_STATES=('Queued','Preparing data','Checking freshness','Running model','Explaining results','Building impact map','Saving results','Completed','Failed','Needs review')
class WorkflowAdapter:
    def start(self,decision_id,scenario_id,idempotency_key):
        if not decision_id or not scenario_id or not idempotency_key:raise ValueError('Decision, scenario, and idempotency key are required.')
        raise NotImplementedError('AWS Step Functions and Lambda are not attached; no background job was started.')
    @staticmethod
    def validate_state(state):
        if state not in JOB_STATES:raise ValueError('Unknown workflow state.')
        return state
