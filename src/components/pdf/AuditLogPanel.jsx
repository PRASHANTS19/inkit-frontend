import React, { useMemo } from 'react';
import { useAuditStore, ACTION_LABELS } from '../../store/auditStore';
import { Trash2, Activity } from 'lucide-react';

/**
 * AuditLogPanel (P5-T5)
 *
 * Right-panel "Activity" tab. Shows a scrollable, chronological audit log
 * of user actions for the current document with relative timestamps.
 *
 * Props:
 *   documentId  – current document ID
 */

function relativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5)   return 'just now';
  if (diffSec < 60)  return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)   return `${diffHr}h ago`;
  return new Date(isoString).toLocaleDateString();
}

// Map action → colour token  
const ACTION_COLOR = {
  open:       'text-blue-600   bg-blue-50   border-blue-200',
  close:      'text-slate-500  bg-slate-50  border-slate-200',
  annotate:   'text-violet-600 bg-violet-50 border-violet-200',
  delete:     'text-red-600    bg-red-50    border-red-200',
  highlight:  'text-yellow-600 bg-yellow-50 border-yellow-200',
  signature:  'text-indigo-600 bg-indigo-50 border-indigo-200',
  form_save:  'text-green-600  bg-green-50  border-green-200',
  form_reset: 'text-orange-600 bg-orange-50 border-orange-200',
  export:     'text-cyan-600   bg-cyan-50   border-cyan-200',
  print:      'text-teal-600   bg-teal-50   border-teal-200',
  share:      'text-pink-600   bg-pink-50   border-pink-200',
  organize:   'text-amber-600  bg-amber-50  border-amber-200',
  watermark:  'text-purple-600 bg-purple-50 border-purple-200',
  search:     'text-sky-600    bg-sky-50    border-sky-200',
};

export function AuditLogPanel({ documentId }) {
  const getLogs  = useAuditStore(s => s.getLogs);
  const clearLogs = useAuditStore(s => s.clearLogs);

  // Subscribe to logs reactively
  const logs = useAuditStore(s => s.logs[documentId] || []);

  const grouped = useMemo(() => {
    const groups = {};
    logs.forEach(entry => {
      const day = new Date(entry.timestamp).toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric',
      });
      if (!groups[day]) groups[day] = [];
      groups[day].push(entry);
    });
    return groups;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
        <Activity className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 font-medium">No activity yet</p>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Actions like annotations, exports, and signatures will be logged here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {logs.length} Event{logs.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => clearLogs(documentId)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          title="Clear activity log"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([day, entries]) => (
          <div key={day}>
            {/* Day divider */}
            <div className="px-4 py-1.5 bg-slate-50 border-y border-slate-100 sticky top-0 z-10">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{day}</span>
            </div>

            {entries.map(entry => {
              const colorClass = ACTION_COLOR[entry.action] || 'text-slate-600 bg-slate-50 border-slate-200';
              const icon = ACTION_LABELS[entry.action] || '•';
              return (
                <div
                  key={entry.id}
                  className="px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3"
                >
                  {/* Icon pill */}
                  <span
                    className={`mt-0.5 shrink-0 text-[11px] px-1.5 py-0.5 rounded border font-medium ${colorClass}`}
                  >
                    {icon}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug line-clamp-2">
                      {entry.description}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {relativeTime(entry.timestamp)}
                      <span className="ml-1 opacity-60">
                        · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
