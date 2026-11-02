
"""Tests for FastAPI endpoints."""

import unittest

from fastapi.testclient import TestClient

from backend.app import app
from backend.api import routes


class FastAPITests(unittest.TestCase):

    def setUp(self):
        # Give every test a fresh in-memory store.
        routes._store = None
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_missing_decision_fields(self):
        response = self.client.post(
            "/api/decisions",
            json={"title": "Test Decision"}
        )
        self.assertEqual(response.status_code, 422)

    def test_create_decision(self):
        response = self.client.post(
            "/api/decisions",
            json={
                "title": "Test Decision",
                "original_question": "Should we expand?",
                "objective": "Evaluate expansion",
                "time_horizon": "6 months",
                "constraints": ["Budget"],
                "metrics": ["Revenue"]
            }
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["title"], "Test Decision")

    def test_submit_briefing(self):
        response = self.client.post("/api/briefings/demo/submit")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["action"], "requested")

    def test_unauthorized_approval(self):
        response = self.client.post(
            "/api/approvals",
            json={
                "actor_role": "VP Operations",
                "action": "approved",
                "comment": "Test"
            }
        )
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
