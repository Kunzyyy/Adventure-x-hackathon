import { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { useExportPdf } from "../../hooks/useExportPdf";

export default function ResumeTool() {
  const api = useApi();
  const exportPdf = useExportPdf();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", education: "", skills: "", experience: "", targetRole: "" });
  const [result, setResult] = useState<any>(null);
  const [polishResult, setPolishResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setPolishResult(null);
    try {
      const res = await api.generateResume(form);
      setResult(res);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePolish = async () => {
    setPolishLoading(true);
    try {
      // Collect the currently displayed resume text
      const resumeEl = document.getElementById("resume-pdf-export");
      const resumeText = resumeEl?.innerText || result?.optimizedResume || "";
      const res = await api.polishResume(resumeText, form, form.targetRole);
      setPolishResult(res);
    } catch (err: any) {
      setPolishResult({ error: err.message });
    } finally {
      setPolishLoading(false);
    }
  };

  // Determine which resume content to display
  const displayResume = polishResult?.optimizedResume || result?.starRewrite || form.experience;
  const displayScore = polishResult?.newScore || result?.hrScore;

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold">📄 简历生成</h3>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          {[
            { key: "name", label: "姓名", ph: "你的姓名" },
            { key: "education", label: "教育背景", ph: "北京大学 计算机科学 本科" },
            { key: "skills", label: "技能", ph: "Python, React, 数据分析" },
            { key: "targetRole", label: "目标岗位（可选）", ph: "前端开发工程师" },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label className="block text-sm text-white/50 mb-1.5">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">工作/项目经历</label>
            <textarea
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="描述你的经历，越详细越好..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>
          <button onClick={handleGenerate} disabled={loading || !form.name || !form.skills} className="btn-primary w-full py-3">
            {loading ? "AI 生成中..." : "生成简历"}
          </button>
        </div>

        {/* Result */}
        <div className="min-h-[400px]">
          {result ? (
            result.error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400 text-sm">{result.error}</div>
            ) : (
              <div>
                <div ref={resumeRef} id="resume-pdf-export" className="bg-[#1c1c1e] rounded-xl p-8 border border-white/10 space-y-5 text-sm">
                  <h2 className="text-2xl font-bold text-center mb-6">{form.name} 的简历</h2>
                  <div>
                    <h3 className="text-base font-semibold text-blue-400 mb-2">教育背景</h3>
                    <p className="text-white/70">{form.education || "待补充"}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-blue-400 mb-2">技能</h3>
                    <p className="text-white/70">{form.skills || "待补充"}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-blue-400 mb-2">工作经历</h3>
                    <p className="text-white/70 whitespace-pre-wrap">{displayResume || "待补充"}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-blue-400 mb-2">适合岗位</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.matchedRoles?.map((r: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">HR评分</span>
                    <span className="text-2xl font-bold text-green-400">
                      {displayScore}<span className="text-sm text-white/30">/100</span>
                      {polishResult && !polishResult.error && (
                        <span className="text-xs text-blue-400 ml-2">↑ 已优化</span>
                      )}
                    </span>
                  </div>

                  {/* Polish section */}
                  <button
                    onClick={handlePolish}
                    disabled={polishLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                  >
                    <span>✨</span>
                    {polishLoading ? "AI 优化中..." : "AI 优化措辞"}
                  </button>

                  {/* Polish before/after */}
                  {polishResult && !polishResult.error && (
                    <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 space-y-3">
                      <p className="text-xs text-blue-300">{polishResult.changesSummary}</p>
                      {polishResult.beforeAfter && (
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="bg-white/[0.03] rounded-lg p-3">
                            <span className="text-red-400/60 block mb-1">优化前</span>
                            <span className="text-white/50">{polishResult.beforeAfter.before}</span>
                          </div>
                          <div className="bg-green-500/5 rounded-lg p-3">
                            <span className="text-green-400/60 block mb-1">优化后</span>
                            <span className="text-white/70">{polishResult.beforeAfter.after}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {polishResult?.error && (
                    <div className="bg-red-500/10 rounded-xl p-3 text-red-400 text-xs">{polishResult.error}</div>
                  )}

                  {/* Suggestions */}
                  {result.suggestions?.length > 0 && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-white/40 mb-2">改进建议</p>
                      <ul className="space-y-1">
                        {result.suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-xs text-white/50 flex gap-2">
                            <span className="text-blue-400 flex-shrink-0">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => exportPdf("resume-pdf-export", `${form.name}_简历.pdf`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    下载 PDF 简历
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] text-white/20 text-sm">填写信息后点击生成简历</div>
          )}
        </div>
      </div>
    </div>
  );
}
