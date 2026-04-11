import logging
from typing import Any

logger = logging.getLogger(__name__)

# Heuristics to decide best chart type
TIME_COLS = {"viewed_at", "created_at", "published_at", "date", "day", "week", "month"}
COUNT_COLS = {"count", "views", "total", "engagement", "likes", "shares", "comments"}


def _detect_chart_type(columns: list[str], rows: list[dict]) -> str | None:
    if len(rows) < 2:
        return None
    col_set = {c.lower() for c in columns}
    has_time = bool(col_set & TIME_COLS)
    has_numeric = any(
        isinstance(v, (int, float))
        for row in rows[:3]
        for v in row.values()
    )
    if not has_numeric:
        return None
    if has_time:
        return "line"
    if len(rows) <= 20:
        return "bar"
    return "bar"


def _serialize_row(row: dict) -> dict:
    """Make row JSON-serializable (handle datetime, Decimal, etc.)."""
    result = {}
    for k, v in row.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        elif hasattr(v, "__float__"):
            result[k] = float(v)
        else:
            result[k] = v
    return result


class ResponseFormatter:
    def format(
        self,
        natural_query: str,
        sql: str,
        explanation: str,
        rows: list[dict],
        columns: list[str],
    ) -> dict[str, Any]:
        serialized_rows = [_serialize_row(r) for r in rows]
        chart_type = _detect_chart_type(columns, rows)

        # Build chatbot message
        if len(rows) == 0:
            message = "No results found for your query."
        elif len(rows) == 1 and len(columns) == 1:
            val = list(serialized_rows[0].values())[0]
            message = f"{explanation or natural_query}: **{val}**"
        else:
            message = (
                f"{explanation or 'Here are the results'}. "
                f"Found **{len(rows)}** record{'s' if len(rows) != 1 else ''}."
            )

        chart_config = None
        if chart_type and len(columns) >= 2:
            # First column = x axis (category/time), remaining = data series
            x_key = columns[0]
            y_keys = [c for c in columns[1:] if any(
                isinstance(r.get(c), (int, float)) for r in serialized_rows
            )]
            if y_keys:
                chart_config = {
                    "type": chart_type,
                    "x_key": x_key,
                    "y_keys": y_keys,
                }

        return {
            "message": message,
            "sql": sql,
            "columns": columns,
            "rows": serialized_rows,
            "chart": chart_config,
            "row_count": len(rows),
        }
