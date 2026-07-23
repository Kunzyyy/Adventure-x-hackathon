import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Preset {
  id: string;
  name: string;
  baseURL: string;
  models: string[];
  defaultModel: string;
}

interface Config {
  provider: string;
  baseURL: string;
  model: string;
  hasKey: boolean;
}

export default function AISettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(setConfig);
    fetch("/api/config/presets").then(r => r.json()).then(d => setPresets(d.presets));
  }, []);

  const currentModels = presets.find(p => p.id === selectedPreset)?.models || [];

  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setBaseURL(preset.baseURL);
    if (preset.id !== "custom") {
      setModel(preset.defaultModel);
      setCustomModel("");
    } else {
      setModel("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const finalModel = selectedPreset === "custom" ? customModel : model;
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedPreset,
          apiKey: apiKey || undefined,
          baseURL,
          model: finalModel,
        }),
      });
      if (res.ok) {
        setMessage("✅ 配置已保存并生效");
        const updated = await fetch("/api/config").then(r => r.json());
        setConfig(updated);
      } else {
        setMessage("❌ 保存失败");
      }
    } catch {
      setMessage("❌ 网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
      <h3 className="text-xl font-semibold mb-2">⚙️ AI 模型配置</h3>
      <p className="text-sm text-white/40 mb-8">配置你的 AI 大模型 API，支持 OpenAI、DeepSeek、智谱、通义千问等</p>

      {config && (
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 mb-8 text-sm">
          <span className="text-white/30">当前状态：</span>
          <span className={config.hasKey ? "text-green-400" : "text-yellow-400"}>
            {config.hasKey ? `✅ 已配置 (${config.provider} / ${config.model})` : "⚠️ 演示模式"}
          </span>
        </div>
      )}

      {/* Provider selector */}
      <div className="mb-6">
        <label className="block text-sm text-white/50 mb-3">API 提供商</label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                selectedPreset === p.id
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="mb-6">
        <label className="block text-sm text-white/50 mb-1.5">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={config?.hasKey ? "••••••••（留空则不修改）" : "sk-..."}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      {/* Base URL */}
      <div className="mb-6">
        <label className="block text-sm text-white/50 mb-1.5">API 地址 (Base URL)</label>
        <input
          type="text"
          value={baseURL}
          onChange={(e) => setBaseURL(e.target.value)}
          placeholder="https://api.openai.com/v1"
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-xs"
        />
      </div>

      {/* Model */}
      <div className="mb-6">
        <label className="block text-sm text-white/50 mb-1.5">模型名称</label>
        {selectedPreset === "custom" ? (
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="输入模型名称，如 gpt-4o-mini"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {currentModels.map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  model === m
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error / Success */}
      {message && (
        <div className={`text-sm mb-4 ${message.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
          {message}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || (!apiKey && !config?.hasKey)}
        className="btn-primary w-full py-3"
      >
        {saving ? "保存中..." : "保存配置"}
      </button>

      <p className="text-xs text-white/15 mt-6 leading-relaxed">
        支持所有兼容 OpenAI API 格式的模型服务。DeepSeek、智谱GLM、通义千问、Moonshot 等均可使用。
        配置会保存在服务器端，重启后仍然有效。
      </p>
    </motion.div>
  );
}
