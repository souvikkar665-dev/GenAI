"""Unit tests for validation and governed workflow contracts; no external database needed."""
import unittest
from backend.core.validation import decision_payload,scenario_payload,validate_prediction
from backend.services.approval_service import ApprovalEngine
from backend.services.scenario_service import ScenarioEngine
from backend.api import routes

class ServiceTests(unittest.TestCase):
    def test_decision_requires_objective_constraints_horizon_and_metrics(self):
        with self.assertRaises(ValueError):decision_payload({'title':'A decision'})
        valid=decision_payload({'title':'Delay a regional launch','original_question':'What if we delay the regional launch by two weeks?','objective':'Reduce support pressure','time_horizon':'60 days','constraints':['budget'],'metrics':['tickets']})
        self.assertEqual(valid['metrics'],['tickets'])
    def test_scenario_requires_description(self):
        with self.assertRaises(ValueError):scenario_payload({'name':'Alt'})
    def test_prediction_bounds_and_confidence(self):
        with self.assertRaises(ValueError):validate_prediction({'value':2,'lower_bound':3,'upper_bound':1,'confidence':.8})
        with self.assertRaises(ValueError):validate_prediction({'value':4,'lower_bound':1,'upper_bound':3,'confidence':.8})
        with self.assertRaises(ValueError):validate_prediction({'value':2,'lower_bound':1,'upper_bound':3,'confidence':1.2})
    def test_only_approver_can_record_final_decision(self):
        with self.assertRaises(PermissionError):ApprovalEngine.authorize('Decision Owner','approved')
        self.assertTrue(ApprovalEngine.authorize('Approver','approved'))
    def test_briefing_notes_create_a_new_version(self):
        routes._store=None
        code,record=routes.route('POST','/api/briefings',{'decision_id':'dec-launch','scenario_id':'sc-14d','human_notes':'Proceed only after capacity check.'})
        self.assertEqual(code,201);self.assertEqual(record['version'],4)
        code,records=routes.route('GET','/api/briefings')
        self.assertEqual(code,200);self.assertEqual(records[0]['human_notes'],'Proceed only after capacity check.')
    def test_demo_api_is_labeled_and_decision_endpoint_works(self):
        routes._store=None
        code,health=routes.route('GET','/api/health')
        self.assertEqual(code,200);self.assertEqual(health['database'],'in-memory demo')
        code,decisions=routes.route('GET','/api/decisions')
        self.assertEqual(code,200);self.assertTrue(decisions)

if __name__=='__main__':unittest.main()
