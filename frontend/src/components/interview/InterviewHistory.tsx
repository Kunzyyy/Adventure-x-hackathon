import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";

interface SessionPreview {
  id: string;
  createdAt: string;
  messageCount: number;
  preview: string;
  lastMessage: string;
}

interface SessionDetail {
  id: string;
  createdAt: string;
  messages: { role: string; content: string; scores?: any; timestamp: string }[];
}

export default function InterviewHistory() {
  const api = useApi();
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [selected, setSelected] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const base = "/api/interview/history";
        const res = await fetch(base);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const viewDetail = async (sessionId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interview/history/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelected(data.session);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">📋 面试历史</h3>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← 返回列表
          </button>
        )}
      </div>

      {selected ? (
        <div className="space-y-4">
          <p className="text-xs text-white/30">面试时间: {formatDate(selected.createdAt)} · {selected.messages.length} 条消息</p>
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/5 max-h-[600px] overflow-y-auto space-y-4">
            {selected.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-blue-500/20 text-white/80" : "bg-white/5 text-white/60"}`}>
                  <p className="text-xs text-white/20 mb-1">{msg.role === "user" ? "你" : "AI面试官"} · {formatDate(msg.timestamp)}</p>
                  {msg.content}
                  {msg.scores && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex gap-4 text-xs text-white/40">
                      <span>逻辑:{msg.scores.logic}</span>
                      <span>表达:{msg.scores.expression}</span>
                      <span>结构:{msg.scores.structure}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-white/20">加载中...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <p className="text-lg mb-2">暂无面试记录</p>
          <p className="text-sm">完成一次模拟面试后，记录将出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => viewDetail(s.id)}
              className="bg-white/[0.03] rounded-xl p-5 border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/70">{formatDate(s.createdAt)}</span>
                <span className="text-xs text-white/30">{s.messageCount} 条消息</span>
              </div>
              <p className="text-xs text-white/40 truncate">{s.preview}</p>
              <p className="text-xs text-white/30 truncate mt-1">{s.lastMessage}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
