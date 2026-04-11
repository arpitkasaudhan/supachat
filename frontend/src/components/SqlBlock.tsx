"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Code2 } from "lucide-react";

export default function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <Code2 size={13} />
        {open ? "Hide SQL" : "View SQL"}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <pre className="mt-2 p-3 rounded-lg bg-gray-900 border border-gray-700 text-xs text-green-400 overflow-x-auto scrollbar-thin whitespace-pre-wrap">
          {sql}
        </pre>
      )}
    </div>
  );
}
