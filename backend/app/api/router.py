from fastapi import APIRouter

from app.api import agent_runs, auth, cases, entities, evidence, graph, timeline

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])
api_router.include_router(cases.router, tags=["Forensic Cases"])
api_router.include_router(evidence.router, tags=["Evidence Ingestion & Integrity"])
api_router.include_router(graph.router, tags=["Evidence Graph"])
api_router.include_router(timeline.router, tags=["Forensic Timeline"])
api_router.include_router(entities.router, tags=["Entity Resolution"])
api_router.include_router(agent_runs.router, tags=["Agent Reasoning & Recommendations"])
