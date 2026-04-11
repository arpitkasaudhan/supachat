"""
DevOps Agent — Bonus feature.
Provides AI-powered log summarization, RCA, container health diagnostics,
and deployment debugging via a FastAPI router.
"""
import os
import subprocess
import logging
from groq import Groq
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devops", tags=["devops-agent"])

DEVOPS_SYSTEM = """You are a senior DevOps engineer AI assistant.
You analyze logs, explain CI/CD failures, perform root cause analysis (RCA),
and provide actionable remediation steps. Be concise and precise."""


def _get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


class LogAnalysisRequest(BaseModel):
    logs: str
    context: str = ""


class DiagnosticsResponse(BaseModel):
    summary: str
    root_cause: str
    recommendations: list[str]


def _ask_groq(prompt: str) -> str:
    response = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": DEVOPS_SYSTEM},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1024,
    )
    return response.choices[0].message.content


@router.post("/analyze-logs", response_model=DiagnosticsResponse)
async def analyze_logs(req: LogAnalysisRequest):
    """Summarize failed logs and provide RCA."""
    prompt = f"""Analyze these logs and provide:
1. A brief summary (2-3 sentences)
2. Root cause analysis
3. 3-5 specific recommendations to fix the issue

Context: {req.context or 'Production deployment'}

Logs:
{req.logs[:4000]}

Respond in JSON format:
{{"summary": "...", "root_cause": "...", "recommendations": ["...", "..."]}}"""

    try:
        import json
        raw = _ask_groq(prompt)
        start = raw.find("{")
        end = raw.rfind("}") + 1
        data = json.loads(raw[start:end])
        return DiagnosticsResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/health-diagnostics")
async def health_diagnostics():
    """Run container health checks and summarize status."""
    results = {}
    try:
        proc = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}\t{{.Status}}\t{{.Ports}}"],
            capture_output=True, text=True, timeout=10
        )
        results["containers"] = proc.stdout.strip()
    except Exception as e:
        results["containers"] = f"Docker not available: {e}"

    summary = _ask_groq(
        f"Summarize the health of these Docker containers and flag any issues:\n{results['containers']}"
    )
    return {"raw": results, "summary": summary}


@router.post("/explain-failure")
async def explain_failure(req: LogAnalysisRequest):
    """Explain a CI/CD pipeline failure in plain English."""
    explanation = _ask_groq(
        f"Explain this CI/CD failure in plain English and suggest how to fix it:\n\n{req.logs[:3000]}"
    )
    return {"explanation": explanation}


def include_router(app):
    app.include_router(router)
