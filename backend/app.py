

"""FastAPI application for the Counterfactual Boardroom."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from backend.api.routes import route
from backend.models.requests import (
    DecisionCreate,
    ScenarioCreate,
    ApprovalCreate,
    BriefingCreate,
)


# -------------------------------------------------------------------
# Application setup
# -------------------------------------------------------------------

app = FastAPI(
    title="Counterfactual Boardroom API",
    version="1.0.0",
)

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"


# -------------------------------------------------------------------
# Frontend static assets
# -------------------------------------------------------------------

if FRONTEND_DIR.is_dir():
    app.mount(
        "/frontend",
        StaticFiles(directory=str(FRONTEND_DIR)),
        name="frontend",
    )

    videos_dir = FRONTEND_DIR / "videos"
    if videos_dir.is_dir():
        app.mount(
            "/videos",
            StaticFiles(directory=str(videos_dir)),
            name="videos",
        )


# -------------------------------------------------------------------
# Frontend homepage
# -------------------------------------------------------------------

@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/favicon.ico", include_in_schema=False)
def serve_favicon():
    favicon = FRONTEND_DIR / "favicon.ico"

    if favicon.is_file():
        return FileResponse(
            favicon,
            media_type="image/x-icon",
        )

    return Response(status_code=204)


# -------------------------------------------------------------------
# Existing API route integration
# -------------------------------------------------------------------

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


# -------------------------------------------------------------------
# Health and portfolio
# -------------------------------------------------------------------

@app.get("/api/health")
def health():
    return call_route("GET", "/api/health")


@app.get("/api/portfolio")
def portfolio():
    return call_route("GET", "/api/portfolio")


# -------------------------------------------------------------------
# Decisions
# -------------------------------------------------------------------

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
    return call_route(
        "GET",
        f"/api/decisions/{decision_id}",
    )


# -------------------------------------------------------------------
# Scenarios
# -------------------------------------------------------------------

@app.get("/api/scenarios")
def list_scenarios():
    return call_route("GET", "/api/scenarios")


@app.post("/api/decisions/{decision_id}/scenarios")
def create_scenario(
    decision_id: str,
    payload: ScenarioCreate,
):
    return call_route(
        "POST",
        f"/api/decisions/{decision_id}/scenarios",
        payload.model_dump(exclude_none=True),
    )


# -------------------------------------------------------------------
# Impacts
# -------------------------------------------------------------------

@app.get("/api/impacts")
def list_impacts():
    return call_route("GET", "/api/impacts")


# -------------------------------------------------------------------
# Briefings
# -------------------------------------------------------------------

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
    return call_route(
        "POST",
        "/api/briefings/demo/submit",
        {},
    )


# -------------------------------------------------------------------
# Approvals
# -------------------------------------------------------------------

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


# -------------------------------------------------------------------
# Audit
# -------------------------------------------------------------------

@app.get("/api/audit")
def list_audit():
    return call_route("GET", "/api/audit")


# -------------------------------------------------------------------
# Root static asset fallback
# Supports /styles.css, /app.js, fonts and other root-level assets.
# Keep this LAST so API routes take priority.
# -------------------------------------------------------------------

if FRONTEND_DIR.is_dir():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="root_frontend",
    )
