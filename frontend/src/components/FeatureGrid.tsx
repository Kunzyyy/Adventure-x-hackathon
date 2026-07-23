import { motion } from "framer-motion";
import { useScrollReveal } from "../hooks/useScrollReveal";

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "AI Resume OS",
    subtitle: "简历系统",
    description: "AI自动生成专业简历，即使零经历也能通过经历重构创建令人印象深刻的简历。一键获得HR视角的专业评分和优化建议。",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "AI Job Engine",
    subtitle: "岗位引擎",
    description: "智能匹配最适合你的岗位，每日推荐你能通过简历筛选的机会。薪资、成长空间、稳定性三维评分，让决策有据可依。",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
      </svg>
    ),
    title: "AI Interview Coach",
    subtitle: "面试教练",
    description: "AI模拟真实面试官进行多轮对话，自动追问并实时评分。从逻辑性、表达力、结构化三个维度帮你全面提升面试表现。",
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
  },
];

export default function FeatureGrid() {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section id="features" ref={ref} className="py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className={`reveal text-center mb-20 ${isVisible ? "visible" : ""}`}>
          <h2 className="mb-4">三大核心能力</h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto">
            从简历到面试，AI全程陪跑你的求职之路
          </p>
        </div>

        <div className={`reveal-stagger grid md:grid-cols-3 gap-6 ${isVisible ? "visible" : ""}`}>
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              className={`card-apple group relative overflow-hidden`}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className={`mb-5 ${feature.iconColor}`}>{feature.icon}</div>
                <h3 className="mb-1">{feature.title}</h3>
                <p className="text-sm text-white/30 mb-4">{feature.subtitle}</p>
                <p className="text-white/50 leading-relaxed text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
