"""Scenario branch and model-result governance."""
from backend.core.validation import scenario_payload,validate_prediction
class ScenarioEngine:
    @staticmethod
    def validate(body):return scenario_payload(body)
    @staticmethod
    def validate_run(predictions,model_version,data_snapshot):
        if not model_version or not data_snapshot:raise ValueError('Model version and data snapshot are required for reproducibility.')
        clean=[validate_prediction(p) for p in predictions]
        return {'predictions':clean,'model_version':model_version,'data_snapshot':data_snapshot}
    @staticmethod
    def unavailable(reason='Predictive model adapter is not configured.'):
        return {'status':'needs_review','predictions':[],'message':reason}
