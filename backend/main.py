import os
import time
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prometheus_fastapi_instrumentator import Instrumentator

from nl_to_sql import NLToSQLTranslator
from supabase_client import SupabaseClient
from response_formatter import ResponseFormatter
from devops_agent import include_router as include_devops_router

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SupaChat backend starting up")
    yield
    logger.info("SupaChat backend shutting down")


app = FastAPI(title="SupaChat API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

include_devops_router(app)

supabase_client = SupabaseClient()
nl_translator = NLToSQLTranslator()
formatter = ResponseFormatter()


class QueryRequest(BaseModel):
    query: str
    history: list[dict] = []


class HealthResponse(BaseModel):
    status: str
    supabase: str
    timestamp: float


@app.get("/health", response_model=HealthResponse)
async def health_check():
    supabase_ok = "ok"
    try:
        supabase_client.check_connection()
    except Exception as e:
        supabase_ok = f"error: {str(e)}"
    return HealthResponse(
        status="ok",
        supabase=supabase_ok,
        timestamp=time.time(),
    )


@app.post("/api/query")
async def query(req: QueryRequest):
    start = time.time()
    logger.info(f"Query received: {req.query}")
    try:
        # Step 1: NL → SQL via Claude MCP tool-use pattern
        sql, explanation = await nl_translator.translate(req.query, req.history)
        logger.info(f"Generated SQL: {sql}")

        # Step 2: Execute SQL via Supabase
        rows, columns = supabase_client.execute_sql(sql)
        logger.info(f"Query returned {len(rows)} rows")

        # Step 3: Format response (text + table + chart)
        response = formatter.format(req.query, sql, explanation, rows, columns)
        response["latency_ms"] = round((time.time() - start) * 1000, 2)
        return response

    except Exception as e:
        logger.error(f"Query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/schema")
async def get_schema():
    try:
        schema = supabase_client.get_schema()
        return {"schema": schema}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
