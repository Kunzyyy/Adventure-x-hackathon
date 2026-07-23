import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Provider {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
  baseURL: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [provider, setProvider] = useState("deepseek");
  const [model, setModel] = useState("deepseek-chat");
  const [role, setRole] = useState("career_advisor");
  const [customPrompt, setCustomPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/chat/providers").then((r) => r.json()).then((d) => {
      setProviders(d.providers);
      // Set default model for current provider
      const p = d.providers.find((p: Provider) => p.id === "deepseek");
      if (p) setModel(p.defaultModel);
    });
    fetch("/api/chat/roles").then((r) => r.json()).then((d) => setRoles(d.roles));
  }, []);

  useEffect(() => {
    // Update model when provider changes
    const p = providers.find((p) => p.id === provider);
    if (p) setModel(p.defaultModel);
  }, [provider, providers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const currentModels = providers.find((p) => p.id === provider)?.models || [];
  const currentRole = roles.find((r) => r.id === role);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setStreaming(true);
    setStreamText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-20),
          provider,
          model,
          role,
          customSystemPrompt: role === "custom" ? customPrompt : undefined,
        }),
        signal: controller.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "chunk") {
              fullText += data.content;
              setStreamText(fullText);
            } else if (data.type === "done") {
              setStreamText("");
              setMessages((prev) => [...prev, { role: "assistant", content: data.fullText || fullText }]);
            } else if (data.type === "error") {
              setStreamText("");
              setMessages((prev) => [...prev, { role: "assistant", content: "❌ 错误: " + data.error }]);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: "❌ 请求失败: " + err.message }]);
      }
    } finally {
      setStreaming(false);
      setStreamText("");
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    if (streamText) {
      setMessages((prev) => [...prev, { role: "assistant", content: streamText + " [已中断]" }]);
    }
    setStreamText("");
  };

  const clearChat = () => setMessages([]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full max-h-[calc(100vh-7rem)]"
    >
      {/* Header with selectors */}
      <div className="flex-shrink-0 mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold mr-2">🤖 AI Chat</h3>

        {/* Provider + Model */}
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:outline-none focus:border-blue-500/50"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {currentModels.length > 0 && (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:outline-none focus:border-blue-500/50"
          >
            {currentModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}

        {provider === "custom" && (
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="模型名称"
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:outline-none focus:border-blue-500/50 w-32"
          />
        )}

        {/* Role */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:outline-none focus:border-blue-500/50"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <button
          onClick={clearChat}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs hover:text-white/70 transition-colors ml-auto"
        >
          清空对话
        </button>
      </div>

      {/* Custom prompt for custom role */}
      {role === "custom" && (
        <div className="flex-shrink-0 mb-3">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="输入自定义系统提示词..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs placeholder-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
          />
        </div>
      )}

      {/* Role description */}
      {currentRole && (
        <p className="flex-shrink-0 text-xs text-white/20 mb-4">🎯 {currentRole.description}</p>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px] bg-white/[0.02] rounded-xl p-4 border border-white/5">
        {messages.length === 0 && !streaming && (
          <div className="flex items-center justify-center h-full text-white/15 text-sm">
            选择一个角色，开始对话吧 💬
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-500/20 text-white/80"
                  : "bg-white/5 text-white/70"
              }`}
            >
              {msg.content.startsWith("❌") ? (
                <span className="text-red-400">{msg.content}</span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {streaming && streamText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-white/5 text-white/70">
              {streamText}
              <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}
        {streaming && !streamText && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 text-sm bg-white/5 text-white/30 animate-pulse">...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={streaming ? "AI 回复中..." : "输入你的消息... (Enter 发送)"}
          disabled={streaming}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
        />
        {streaming ? (
          <button onClick={stopStreaming} className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
            停止
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="btn-primary py-3 px-6"
          >
            发送
          </button>
        )}
      </div>
    </motion.div>
  );
}
