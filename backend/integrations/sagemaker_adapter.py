"""Amazon SageMaker boundary. No numerical forecast is fabricated by this stub."""
from backend.core.validation import validate_prediction
class SageMakerAdapter:
    def predict(self,features,model_endpoint=None):
        if not isinstance(features,dict):raise ValueError('Features must be a structured object.')
        if not model_endpoint:raise RuntimeError('No SageMaker endpoint is configured; predictions are unavailable.')
        raise NotImplementedError('Attach an authorized AWS runtime and model endpoint before enabling prediction.')
    @staticmethod
    def validate_response(rows,model_version,data_snapshot):
        if not model_version or not data_snapshot:raise ValueError('Model version and data snapshot are required.')
        return [validate_prediction(row) for row in rows]
