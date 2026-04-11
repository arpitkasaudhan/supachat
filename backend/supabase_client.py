import os
import psycopg
from psycopg.rows import dict_row
import logging

logger = logging.getLogger(__name__)

DB_SCHEMA = {
    "articles": {
        "columns": ["id", "title", "topic", "author", "published_at", "content"],
        "description": "Blog articles with topic categorization",
    },
    "article_views": {
        "columns": ["id", "article_id", "viewed_at", "country"],
        "description": "Page view events per article",
    },
    "article_engagements": {
        "columns": ["id", "article_id", "engagement_type", "created_at"],
        "description": "User engagement events: like, share, comment",
    },
}


class SupabaseClient:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        if not self.db_url:
            # Build from individual parts
            host = os.getenv("SUPABASE_DB_HOST")
            port = os.getenv("SUPABASE_DB_PORT", "5432")
            name = os.getenv("SUPABASE_DB_NAME", "postgres")
            user = os.getenv("SUPABASE_DB_USER", "postgres")
            password = os.getenv("SUPABASE_DB_PASSWORD")
            self.db_url = f"postgresql://{user}:{password}@{host}:{port}/{name}"

    def _get_conn(self):
        return psycopg.connect(self.db_url, row_factory=dict_row)

    def check_connection(self):
        with self._get_conn() as conn:
            conn.execute("SELECT 1")

    def execute_sql(self, sql: str) -> tuple[list[dict], list[str]]:
        """Execute a read-only SQL query and return rows + column names."""
        normalized = sql.strip().upper()
        if not normalized.startswith("SELECT") and not normalized.startswith("WITH"):
            raise ValueError("Only SELECT/WITH queries are allowed")

        with self._get_conn() as conn:
            cur = conn.execute(sql)
            rows = cur.fetchall()
            columns = [desc.name for desc in cur.description] if cur.description else []
        return rows, columns

    def get_schema(self) -> dict:
        return DB_SCHEMA
