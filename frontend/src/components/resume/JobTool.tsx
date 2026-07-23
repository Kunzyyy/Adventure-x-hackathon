import { useState } from "react";
import { useApi } from "../../hooks/useApi";

export default function JobTool() {
  const api = useApi();
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.matchJobs({ skills: skills.split(",").map((s) => s.trim()).filter(Boolean), experience, education });
      setResult(res);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold">🔍 岗位匹配</h3>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[
            { key: "skills", val: skills, set: setSkills, label: "技能（逗号分隔）", ph: "Python, React, 数据分析" },
            { key: "experience", val: experience, set: setExperience, label: "工作经历", ph: "2年前端开发经验..." },
            { key: "education", val: education, set: setEducation, label: "教育背景", ph: "本科 计算机科学" },
          ].map(({ key, val, set, label, ph }) => (
            <div key={key}>
              <label className="block text-sm text-white/50 mb-1.5">{label}</label>
              <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
          ))}
          <button onClick={handleMatch} disabled={loading || !skills} className="btn-primary w-full py-3">
            {loading ? "匹配中..." : "开始匹配"}
          </button>
        </div>
        <div className="min-h-[400px]">
          {result ? (
            result.error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400 text-sm">{result.error}</div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-white/50 bg-white/[0.03] rounded-xl p-4 border border-white/5">{result.overallAnalysis}</p>
                {result.jobs?.map((job: any, i: number) => (
                  <div key={i} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white/80">{job.title}</span>
                      <span className="text-green-400 font-bold text-lg">{job.matchScore}%</span>
                    </div>
                    <p className="text-xs text-white/40 mb-2">{job.company} · {job.salaryRange}</p>
                    <div className="flex gap-4 mb-2">
                      <span className="text-xs text-white/30">成长 ⭐{job.growthScore}</span>
                      <span className="text-xs text-white/30">稳定 ⭐{job.stabilityScore}</span>
                    </div>
                    <p className="text-xs text-white/50">{job.reason}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] text-white/20 text-sm">输入技能后点击匹配</div>
          )}
        </div>
      </div>
    </div>
  );
}
