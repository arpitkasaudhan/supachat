const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface QueryResult {
  message: string;
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  chart: {
    type: "bar" | "line" | "pie";
    x_key: string;
    y_keys: string[];
  } | null;
  row_count: number;
  latency_ms?: number;
}

export interface HistoryItem {
  id: string;
  query: string;
  result: QueryResult;
  timestamp: Date;
}

export async function sendQuery(
  query: string,
  history: Array<{ role: string; content: string }>
): Promise<QueryResult> {
  const res = await fetch(`${API_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; supabase: string }> {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}
