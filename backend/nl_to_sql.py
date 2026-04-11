import os
import json
import logging
from groq import Groq

logger = logging.getLogger(__name__)

SCHEMA_CONTEXT = """You are a SQL expert for a blog analytics PostgreSQL database.

Database schema:
- articles(id SERIAL, title TEXT, topic TEXT, author TEXT, published_at TIMESTAMPTZ, content TEXT)
- article_views(id SERIAL, article_id INT REFERENCES articles, viewed_at TIMESTAMPTZ, country TEXT)
- article_engagements(id SERIAL, article_id INT REFERENCES articles, engagement_type TEXT ('like','share','comment'), created_at TIMESTAMPTZ)

Rules:
- Only generate SELECT or WITH (CTE) queries — never INSERT/UPDATE/DELETE.
- Always use table aliases.
- Use NOW() for current time. For "last 30 days": viewed_at >= NOW() - INTERVAL '30 days'
- Return ONLY a JSON object with exactly two keys: "sql" and "explanation".
- No markdown, no code fences, just raw JSON.

Example output:
{"sql": "SELECT a.topic, COUNT(*) AS views FROM article_views av JOIN articles a ON a.id = av.article_id WHERE av.viewed_at >= NOW() - INTERVAL '30 days' GROUP BY a.topic ORDER BY views DESC", "explanation": "Top topics by views in the last 30 days"}
"""


class NLToSQLTranslator:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        return self._client

    async def translate(self, query: str, history: list[dict]) -> tuple[str, str]:
        """Convert natural language query to SQL using Groq (llama-3.1-70b)."""
        messages = [{"role": "system", "content": SCHEMA_CONTEXT}]

        # Add last 6 turns of history
        for h in history[-6:]:
            if h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": str(h["content"])})

        messages.append({"role": "user", "content": f"Generate SQL for: {query}"})

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=512,
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()
        logger.info(f"Groq raw response: {raw}")

        # Parse JSON response
        try:
            # Strip markdown fences if model adds them anyway
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
            sql = data.get("sql", "").strip()
            explanation = data.get("explanation", "")
            if sql:
                return sql, explanation
        except json.JSONDecodeError:
            pass

        # Fallback: try to extract SQL directly from text
        lines = raw.split("\n")
        for line in lines:
            line = line.strip()
            if line.upper().startswith(("SELECT", "WITH")):
                return line, "Generated SQL query"

        raise ValueError(f"Could not parse SQL from model response: {raw[:200]}")
