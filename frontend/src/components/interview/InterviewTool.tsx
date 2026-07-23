import { useState } from "react";
import { useApi } from "../../hooks/useApi";

export default function InterviewTool() {
  const api = useApi();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string; scores?: any }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.startInterview();
      setSessionId(res.sessionId);
      setMessages([{ role: "assistant", content: res.message }]);
    } catch (err: any) {
      setMessages([{ role: "assistant", content: "启动失败: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.interviewChat(sessionId, userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, scores: res.scores }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "出错了: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold">💬 模拟面试</h3>
      {!sessionId ? (
        <div className="text-center py-20">
          <p className="text-white/30 mb-6">AI 面试官将模拟真实面试，自动追问并评分</p>
          <button onClick={startInterview} disabled={loading} className="btn-primary">
            {loading ? "启动中..." : "开始模拟面试"}
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/5 h-[500px] overflow-y-auto mb-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-blue-500/20 text-white/80" : "bg-white/5 text-white/60"}`}>
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
            {loading && <div className="text-white/20 text-sm animate-pulse">AI 面试官思考中...</div>}
          </div>
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="输入你的回答..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary py-3 px-6">发送</button>
          </div>
        </div>
      )}
    </div>
  );
}
