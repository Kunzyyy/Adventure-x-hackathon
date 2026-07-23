import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TOOLS = [
  { to: "/dashboard/resume", title: "AI Resume OS", subtitle: "简历生成 & 优化", icon: "📄", desc: "AI 生成专业简历，零经历也能通过经历重构创建令人印象深刻的简历。" },
  { to: "/dashboard/job", title: "AI Job Engine", subtitle: "智能岗位匹配", icon: "🔍", desc: "智能匹配最适合的岗位，薪资、成长、稳定性三维评分。" },
  { to: "/dashboard/interview", title: "AI Interview Coach", subtitle: "模拟面试官", icon: "💬", desc: "AI 模拟真实面试，自动追问并实时评分。" },
  { to: "/dashboard/history", title: "面试历史", subtitle: "复盘 & 提升", icon: "📋", desc: "回顾每次面试记录，查看评分，持续改进。" },
];

export default function DashboardHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="mb-2">你好，{user.name || "用户"}</h2>
      <p className="text-lg text-white/40 mb-10">今天想使用哪个 AI 求职工具？</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {TOOLS.map((tool, i) => (
          <Link key={tool.to} to={tool.to}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="card-apple h-full cursor-pointer group"
            >
              <div className="text-3xl mb-4">{tool.icon}</div>
              <h3 className="mb-1 text-base">{tool.title}</h3>
              <p className="text-xs text-white/30 mb-3">{tool.subtitle}</p>
              <p className="text-sm text-white/50">{tool.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
