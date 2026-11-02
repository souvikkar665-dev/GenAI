
"""FastAPI application for the backend API."""

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from backend.api.routes import route
from backend.models.requests import (
    DecisionCreate,
    ScenarioCreate,
    ApprovalCreate,
    BriefingCreate,
)

app = FastAPI(
    title="Counterfactual Boardroom API",
    version="1.0.0",
)


def call_route(method, path, body=None):
    """Connect FastAPI endpoints to the existing application router."""
    try:
        status_code, payload = route(method, path, body)
        return JSONResponse(
            status_code=status_code,
            content=jsonable_encoder(payload),
        )
    except PermissionError as exc:
        return JSONResponse(
            status_code=403,
            content={"error": str(exc)},
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"error": str(exc)},
        )


@app.get("/api/health")
def health():
    return call_route("GET", "/api/health")


@app.get("/api/portfolio")
def portfolio():
    return call_route("GET", "/api/portfolio")


@app.get("/api/decisions")
def list_decisions():
    return call_route("GET", "/api/decisions")


@app.post("/api/decisions")
def create_decision(payload: DecisionCreate):
    return call_route(
        "POST",
        "/api/decisions",
        payload.model_dump(exclude_none=True),
    )


@app.get("/api/decisions/{decision_id}")
def get_decision(decision_id: str):
    return call_route("GET", f"/api/decisions/{decision_id}")


@app.get("/api/scenarios")
def list_scenarios():
    return call_route("GET", "/api/scenarios")


@app.post("/api/decisions/{decision_id}/scenarios")
def create_scenario(decision_id: str, payload: ScenarioCreate):
    return call_route(
        "POST",
        f"/api/decisions/{decision_id}/scenarios",
        payload.model_dump(exclude_none=True),
    )


@app.get("/api/impacts")
def list_impacts():
    return call_route("GET", "/api/impacts")


@app.get("/api/briefings")
def list_briefings():
    return call_route("GET", "/api/briefings")


@app.post("/api/briefings")
def create_briefing(payload: BriefingCreate):
    return call_route(
        "POST",
        "/api/briefings",
        payload.model_dump(exclude_none=True),
    )


@app.post("/api/briefings/demo/submit")
def submit_briefing():
    return call_route("POST", "/api/briefings/demo/submit", {})


@app.get("/api/approvals")
def list_approvals():
    return call_route("GET", "/api/approvals")


@app.post("/api/approvals")
def decide_approval(payload: ApprovalCreate):
    return call_route(
        "POST",
        "/api/approvals",
        payload.model_dump(),
    )


@app.get("/api/audit")
def list_audit():
    return call_route("GET", "/api/audit")
