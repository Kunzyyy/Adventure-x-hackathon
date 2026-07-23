import { motion } from "framer-motion";

function StatCard({ label, value, change, icon }: {
  label: string; value: string; change: string; icon: string;
}) {
  return (
    <motion.div
      className="keal-glass-sm"
      style={{ padding: 24 }}
      whileHover={{ y: -2 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--keal-text-secondary)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="keal-stat">{value}</div>
      <div style={{ fontSize: 12, color: "var(--keal-accent)", fontWeight: 600, marginTop: 6 }}>
        {change}
      </div>
    </motion.div>
  );
}

function CandidateRow({ name, role, match, skills, avatar }: {
  name: string; role: string; match: number; skills: string[]; avatar: string;
}) {
  const bgColors = ["#5b5fef", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];
  return (
    <motion.div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 14,
        background: "rgba(91, 95, 239, 0.02)",
        border: "1px solid rgba(91, 95, 239, 0.04)",
      }}
      whileHover={{ background: "rgba(91, 95, 239, 0.05)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="keal-avatar" style={{
        background: "var(--keal-gradient)", width: 36, height: 36, fontSize: 14
      }}>
        {avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--keal-text-secondary)" }}>{role}</div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {skills.slice(0, 3).map((s, i) => (
          <span key={s} style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 6,
            background: `${bgColors[i % bgColors.length]}15`,
            color: bgColors[i % bgColors.length], fontWeight: 600
          }}>{s}</span>
        ))}
      </div>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 16, fontWeight: 700 }} className="keal-gradient-text">{match}%</span>
      </div>
    </motion.div>
  );
}

// Simple bar chart with CSS
function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--keal-text)" }}>
            {d.value}
          </span>
          <motion.div
            style={{
              width: "100%", borderRadius: "6px 6px 0 0",
              background: d.color,
              maxWidth: 40,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          />
          <span style={{ fontSize: 10, color: "var(--keal-text-tertiary)", fontWeight: 500 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ pct, label }: { pct: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8} />
        <motion.circle
          cx={50} cy={50} r={r} fill="none"
          stroke="url(#donutGrad)" strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5b5fef" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <text x={50} y={48} textAnchor="middle" fill="var(--keal-text)" fontSize={18} fontWeight={800}>
          {pct}%
        </text>
        <text x={50} y={63} textAnchor="middle" fill="var(--keal-text-tertiary)" fontSize={9} fontWeight={500}>
          {label}
        </text>
      </svg>
    </div>
  );
}

export default function EnterpriseDashboard() {
  const stats = [
    { label: "今日候选人数", value: "12,860", change: "↑ 12% vs 昨日", icon: "👥" },
    { label: "AI 筛选人数", value: "3,560", change: "↑ 8% vs 昨日", icon: "🤖" },
    { label: "面试通过率", value: "42%", change: "↑ 5% vs 上周", icon: "✅" },
    { label: "在招岗位数", value: "186", change: "↑ 3 个新增", icon: "📋" },
  ];

  const candidates = [
    { name: "王思涵", role: "AI 产品经理 · 3年经验", match: 95, skills: ["AI/ML", "产品策略", "数据分析"], avatar: "王" },
    { name: "李明远", role: "高级前端工程师", match: 92, skills: ["React", "TypeScript", "Node.js"], avatar: "李" },
    { name: "陈雨桐", role: "数据科学家", match: 89, skills: ["Python", "TensorFlow", "SQL"], avatar: "陈" },
    { name: "张浩然", role: "后端架构师", match: 87, skills: ["Go", "K8s", "微服务"], avatar: "张" },
  ];

  const hiringData = [
    { label: "周一", value: 48, color: "#5b5fef" },
    { label: "周二", value: 62, color: "#7c7ff5" },
    { label: "周三", value: 55, color: "#8b5cf6" },
    { label: "周四", value: 71, color: "#a855f7" },
    { label: "周五", value: 65, color: "#7c7ff5" },
    { label: "周六", value: 38, color: "#5b5fef" },
    { label: "周日", value: 22, color: "#6366f1" },
  ];

  const talentModules = [
    { icon: "🔍", title: "AI 人才搜索", desc: "智能语义搜索，精准匹配候选人" },
    { icon: "📊", title: "AI 简历筛选", desc: "自动评分、技能分析、经验提取" },
    { icon: "🎤", title: "AI 面试助手", desc: "自动生成面试题与评价报告" },
    { icon: "🧬", title: "人才画像分析", desc: "技能雷达图、成长潜力、稳定性预测" },
    { icon: "🗄️", title: "企业人才库", desc: "智能化人才管理与长期跟踪" },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
      {/* Header */}
      <motion.div
        style={{ marginBottom: 32 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{
          fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em",
          margin: "0 0 4px 0"
        }}>
          招聘数据中心
        </h1>
        <p style={{ fontSize: 15, color: "var(--keal-text-secondary)", margin: 0 }}>
          AI 驱动的智能招聘管理 · 实时数据看板
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="keal-data-grid" style={{ marginBottom: 32 }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: 32 }}>
        {/* Left Column */}
        <div style={{ flex: "1 1 65%" }}>
          {/* Talent Modules */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16, marginBottom: 32
          }}>
            {talentModules.slice(0, 3).map((m, i) => (
              <motion.div
                key={i}
                className="keal-glass-sm"
                style={{ padding: 24, cursor: "pointer" }}
                whileHover={{ y: -3 }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="keal-icon-circle" style={{ marginBottom: 14 }}>{m.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "var(--keal-text-secondary)" }}>{m.desc}</div>
              </motion.div>
            ))}
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16, marginBottom: 32
          }}>
            {talentModules.slice(3, 5).map((m, i) => (
              <motion.div
                key={i}
                className="keal-glass-sm"
                style={{ padding: 24, cursor: "pointer" }}
                whileHover={{ y: -3 }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              >
                <div className="keal-icon-circle" style={{ marginBottom: 14 }}>{m.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "var(--keal-text-secondary)" }}>{m.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Top Candidates */}
          <div className="keal-glass" style={{ padding: 24, marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🏆 AI 精选候选人</h3>
              <span className="keal-tag keal-tag-accent">实时更新</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {candidates.map((c, i) => (
                <CandidateRow key={i} {...c} />
              ))}
            </div>
          </div>

          {/* Hiring Trend Chart */}
          <div className="keal-glass" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0" }}>📈 本周招聘趋势</h3>
            <MiniBarChart data={hiringData} />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: "0 0 340px" }}>
          {/* AI Search */}
          <motion.div
            className="keal-glass"
            style={{ padding: 24, marginBottom: 16 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔍 AI 人才搜索</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", borderRadius: 14,
              background: "rgba(0,0,0,0.03)", border: "1px solid var(--keal-border)",
              marginBottom: 12
            }}>
              <span style={{ fontSize: 14, color: "var(--keal-text-tertiary)" }}>🔎</span>
              <input
                type="text"
                placeholder="寻找 AI 产品经理..."
                style={{
                  border: "none", background: "transparent", outline: "none",
                  fontSize: 14, flex: 1, color: "var(--keal-text)",
                  fontFamily: "inherit"
                }}
              />
              <button className="keal-btn" style={{ padding: "6px 16px", fontSize: 12, borderRadius: 10 }}>
                搜索
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["AI产品", "前端工程师", "数据分析", "后端开发"].map((t) => (
                <span key={t} style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 8,
                  background: "rgba(91, 95, 239, 0.06)", color: "var(--keal-accent)",
                  fontWeight: 500, cursor: "pointer"
                }}>{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Pass Rate */}
          <motion.div
            className="keal-glass"
            style={{ padding: 24, marginBottom: 16, textAlign: "center" }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>面试通过率</div>
            <DonutChart pct={42} label="通过率" />
            <div style={{ fontSize: 12, color: "var(--keal-text-secondary)", marginTop: 8 }}>
              较上月提升 5%
            </div>
          </motion.div>

          {/* Talent Pool Summary */}
          <motion.div
            className="keal-glass"
            style={{ padding: 24 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🗄️ 人才库概况</div>
            {[
              { label: "人才库总量", value: "8,420" },
              { label: "本月新增", value: "1,256" },
              { label: "已面试", value: "348" },
              { label: "已录用", value: "42" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0",
                borderBottom: i < 3 ? "1px solid var(--keal-border)" : "none"
              }}>
                <span style={{ fontSize: 13, color: "var(--keal-text-secondary)" }}>{item.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Data Dashboard */}
      <motion.div
        className="keal-glass"
        style={{ padding: 32, marginTop: 32 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px 0" }}>📊 AI 招聘数据分析</h3>
            <span style={{ fontSize: 13, color: "var(--keal-text-secondary)" }}>
              实时数据可视化 · 智能洞察
            </span>
          </div>
          <div className="keal-mode-toggle">
            <button className="keal-mode-btn active">本周</button>
            <button className="keal-mode-btn">本月</button>
            <button className="keal-mode-btn">本季</button>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16
        }}>
          {[
            { label: "简历投递量", value: "3,240", sub: "↑ 18%", chart: "#5b5fef" },
            { label: "AI 筛选通过", value: "1,128", sub: "↑ 12%", chart: "#8b5cf6" },
            { label: "最终录用", value: "86", sub: "↑ 8%", chart: "#a855f7" },
          ].map((item, i) => (
            <div key={i} style={{
              padding: 20, borderRadius: 16,
              background: "rgba(91, 95, 239, 0.03)",
              border: "1px solid rgba(91, 95, 239, 0.06)",
            }}>
              <div style={{ fontSize: 12, color: "var(--keal-text-secondary)", fontWeight: 500, marginBottom: 8 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>
                {item.value}
              </div>
              <span style={{ fontSize: 12, color: "var(--keal-accent)", fontWeight: 600 }}>{item.sub}</span>
              <div style={{
                marginTop: 16, height: 40, borderRadius: 8,
                background: `linear-gradient(90deg, ${item.chart}20, ${item.chart}40, ${item.chart}20)`,
                position: "relative", overflow: "hidden"
              }}>
                <motion.div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "60%", background: `linear-gradient(180deg, transparent, ${item.chart}30)`,
                  borderRadius: "0 0 8px 8px"
                }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
