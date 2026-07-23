import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AIRobot from "./AIRobot";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="keal-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`keal-star ${i <= rating ? "filled" : "empty"}`} />
      ))}
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--keal-text)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--keal-accent)" }}>{value}%</span>
      </div>
      <div className="keal-progress">
        <div className="keal-progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: string;
  title: string;
  metrics: { label: string; value: string }[];
  delay: number;
};

function FeatureCard({ icon, title, metrics, delay }: FeatureCardProps) {
  return (
    <motion.div
      className="keal-glass-sm"
      style={{ padding: 24 }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="keal-icon-circle" style={{ marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--keal-gradient)", flexShrink: 0
            }} />
            <span style={{ fontSize: 13, color: "var(--keal-text-secondary)", fontWeight: 500 }}>
              {m.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--keal-text)", marginLeft: "auto" }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

type JobCardProps = {
  company: string;
  logo: string;
  logoBg: string;
  role: string;
  salary: string;
  match: number;
  reason: string;
  tags: string[];
};

function JobCard({ company, logo, logoBg, role, salary, match, reason, tags }: JobCardProps) {
  return (
    <motion.div
      className="keal-glass-sm"
      style={{ padding: 24, cursor: "pointer" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div className="keal-company-logo" style={{ background: logoBg }}>{logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{role}</div>
          <div style={{ fontSize: 12, color: "var(--keal-text-secondary)", fontWeight: 500 }}>{company}</div>
        </div>
        <div className="keal-tag keal-tag-accent">{match}% 匹配</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--keal-accent)" }}>{salary}</span>
        <span style={{ fontSize: 12, color: "var(--keal-text-tertiary)" }}>/月</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {tags.map((t) => (
          <span key={t} style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 6,
            background: "rgba(0,0,0,0.04)", color: "var(--keal-text-secondary)", fontWeight: 500
          }}>{t}</span>
        ))}
      </div>
      <div style={{
        fontSize: 12, color: "var(--keal-text-secondary)",
        background: "var(--keal-gradient-subtle)", padding: "8px 12px",
        borderRadius: 10, lineHeight: 1.5
      }}>
        <span style={{ fontWeight: 600, color: "var(--keal-accent)" }}>AI 推荐：</span>{reason}
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: "📄", title: "AI 简历优化",
      metrics: [
        { label: "简历评分", value: "92/100" },
        { label: "岗位匹配度", value: "88%" },
        { label: "关键词覆盖", value: "95%" },
      ],
    },
    {
      icon: "🎙️", title: "AI 模拟面试",
      metrics: [
        { label: "已训练次数", value: "126 次" },
        { label: "表达能力", value: "85/100" },
        { label: "逻辑评分", value: "90/100" },
      ],
    },
    {
      icon: "🎯", title: "AI 岗位推荐",
      metrics: [
        { label: "分析岗位数", value: "10,000+" },
        { label: "高匹配岗位", value: "24 个" },
        { label: "新增今日", value: "3 个" },
      ],
    },
    {
      icon: "🗺️", title: "AI 职业规划",
      metrics: [
        { label: "职业路线", value: "5 年规划" },
        { label: "技能路径", value: "已生成" },
        { label: "成长建议", value: "12 条" },
      ],
    },
    {
      icon: "💬", title: "HR 沟通助手",
      metrics: [
        { label: "智能回复", value: "已启用" },
        { label: "消息分析", value: "实时" },
        { label: "沟通建议", value: "8 条" },
      ],
    },
  ];

  const jobs: JobCardProps[] = [
    {
      company: "ByteDance", logo: "B", logoBg: "linear-gradient(135deg, #3255a4, #6b8dd6)", role: "AI 产品经理实习",
      salary: "¥8,000-12,000", match: 92, reason: "你的 AI 项目经验高度匹配该岗位要求。", tags: ["AI/ML", "产品", "实习"],
    },
    {
      company: "Alibaba Cloud", logo: "A", logoBg: "linear-gradient(135deg, #ff6a00, #ff8c40)", role: "云计算产品运营",
      salary: "¥10,000-15,000", match: 88, reason: "你的数据分析能力和产品思维非常契合。", tags: ["云计算", "运营", "全职"],
    },
    {
      company: "Tencent", logo: "T", logoBg: "linear-gradient(135deg, #00b4d8, #48cae4)", role: "AI 策略产品经理",
      salary: "¥12,000-18,000", match: 85, reason: "你的战略分析经验与 AI 产品方向一致。", tags: ["策略", "AI", "校招"],
    },
    {
      company: "Meituan", logo: "M", logoBg: "linear-gradient(135deg, #ffc300, #ffd60a)", role: "商业产品经理",
      salary: "¥9,000-14,000", match: 82, reason: "你的商业分析项目与岗位需求高度相关。", tags: ["商业化", "产品", "实习"],
    },
  ];

  const growthItems = [
    { label: "简历能力", rating: 4 },
    { label: "面试能力", rating: 3 },
    { label: "职业规划", rating: 4 },
    { label: "技术能力", rating: 4 },
    { label: "沟通表达", rating: 3 },
  ];

  const dailyTasks = [
    { text: "完成一次模拟面试", done: false },
    { text: "优化项目经历描述", done: false },
    { text: "投递 3 个匹配岗位", done: true },
    { text: "查看 AI 职业建议", done: false },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
      {/* ─── Hero ─── */}
      <div className="keal-hero">
        <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
          {/* Left: Text + Robot */}
          <div style={{ flex: "1 1 60%" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 style={{
                fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em",
                lineHeight: 1.15, margin: "0 0 16px 0"
              }}>
                让AI陪你找到
                <br />
                <span className="keal-gradient-text">更好的未来</span>
              </h1>
              <p style={{
                fontSize: 17, color: "var(--keal-text-secondary)",
                lineHeight: 1.7, maxWidth: 480, marginBottom: 0
              }}>
                从简历优化，到面试训练，再到 Offer 获取，<br />
                你的 AI 职业教练全程陪伴。
              </p>
            </motion.div>

            {/* 3D Robot */}
            <motion.div
              style={{ marginTop: 24 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              <AIRobot />
            </motion.div>
          </div>

          {/* Right: AI Suggestions */}
          <motion.div
            style={{ flex: "0 0 320px", marginTop: 20 }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="keal-glass" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div className="keal-icon-circle keal-pulse" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 18 }}>
                  🤖
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>AI 今日建议</div>
                  <div style={{ fontSize: 11, color: "var(--keal-text-tertiary)", fontWeight: 500 }}>
                    2026.07.23 · 更新于 2 分钟前
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: "🎯", text: "推荐 3 个高匹配岗位", sub: "匹配度 > 85%" },
                  { icon: "📊", text: "简历匹配度 92%", sub: "较上周提升 5%" },
                  { icon: "🏋️", text: "面试训练完成 80%", sub: "距离目标还差 4 次" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", borderRadius: 14,
                      background: "rgba(91, 95, 239, 0.03)",
                      border: "1px solid rgba(91, 95, 239, 0.06)",
                    }}
                    whileHover={{ background: "rgba(91, 95, 239, 0.06)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.text}</div>
                      <div style={{ fontSize: 12, color: "var(--keal-text-tertiary)" }}>{item.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="keal-btn" style={{ width: "100%", justifyContent: "center", marginTop: 20, fontSize: 14 }}>
                查看详细分析 →
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Core Features ─── */}
      <div style={{ marginTop: 20 }}>
        <motion.div
          style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: 20 }}
          animate={scrolled ? { opacity: 1, y: 0 } : {}}
        >
          <h2 style={{
            fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em",
            marginBottom: 6
          }}>
            核心功能
          </h2>
          <p style={{ fontSize: 15, color: "var(--keal-text-secondary)", margin: 0 }}>
            AI 驱动的全链路求职工具，覆盖你的每一个关键节点
          </p>
        </motion.div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          gap: 16, marginBottom: 48
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i} />
          ))}
        </div>
      </div>

      {/* ─── Job Recommendations + Sidebar ─── */}
      <div style={{ display: "flex", gap: 32 }}>
        {/* Left: Job Cards */}
        <div style={{ flex: "1 1 65%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{
              fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0
            }}>
              为你推荐
            </h2>
            <button className="keal-btn-ghost" style={{ fontSize: 13, padding: "8px 18px" }}>
              查看全部 →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {jobs.map((job, i) => (
              <JobCard key={i} {...job} />
            ))}
          </div>

          {/* AI Community */}
          <div style={{ marginTop: 40 }}>
            <h2 style={{
              fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 20
            }}>
              AI 求职社区
            </h2>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { icon: "👨‍🏫", title: "真人导师", desc: "连接行业前辈，获取一对一职业指导", stat: "200+ 导师" },
                { icon: "💡", title: "经验分享", desc: "来自学长学姐的真实求职经验", stat: "1,286 篇分享" },
                { icon: "🤝", title: "模拟群面", desc: "AI + 真人混合群面训练", stat: "每周 3 场" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="keal-glass-sm"
                  style={{ flex: 1, padding: 28, textAlign: "center" }}
                  whileHover={{ y: -4 }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "var(--keal-text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                  <div className="keal-tag keal-tag-accent">{item.stat}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ flex: "0 0 300px" }}>
          {/* Personal Growth Map */}
          <motion.div
            className="keal-glass"
            style={{ padding: 24, marginBottom: 16 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 style={{
              fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em",
              marginBottom: 20
            }}>
              个人成长地图
            </h3>
            {growthItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 500, width: 80, flexShrink: 0 }}>{item.label}</span>
                <StarRating rating={item.rating} />
              </div>
            ))}
            <hr className="keal-divider" style={{ margin: "16px 0" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--keal-text-secondary)" }}>综合能力评分</span>
              <span style={{ fontSize: 20, fontWeight: 800 }} className="keal-gradient-text">86</span>
            </div>
          </motion.div>

          {/* Daily Tasks */}
          <motion.div
            className="keal-glass"
            style={{ padding: 24 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 style={{
              fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16
            }}>
              今日任务
            </h3>
            {dailyTasks.map((task, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0", borderBottom: i < dailyTasks.length - 1 ? "1px solid var(--keal-border)" : "none"
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: task.done ? "var(--keal-gradient)" : "rgba(0,0,0,0.05)",
                  color: task.done ? "white" : "var(--keal-text-tertiary)",
                }}>
                  {task.done ? "✓" : ""}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: task.done ? "var(--keal-text-tertiary)" : "var(--keal-text)",
                  textDecoration: task.done ? "line-through" : "none",
                }}>
                  {task.text}
                </span>
              </div>
            ))}
            <button className="keal-btn-ghost" style={{ width: "100%", marginTop: 16, fontSize: 13, padding: "10px 0" }}>
              + 添加任务
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
