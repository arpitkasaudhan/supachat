"use client";
import { Clock, Trash2 } from "lucide-react";
import { HistoryItem } from "@/lib/api";

interface Props {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function QueryHistory({ history, onSelect, onClear }: Props) {
  if (!history.length) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={13} /> History
        </span>
        <button onClick={onClear} className="text-gray-600 hover:text-red-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto scrollbar-thin">
        {[...history].reverse().map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-gray-800/50 border-b border-gray-800/50 transition-colors"
            >
              <p className="text-xs text-gray-300 line-clamp-2">{item.query}</p>
              <p className="text-[10px] text-gray-600 mt-1">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
