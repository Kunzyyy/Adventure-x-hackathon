import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function CTA() {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <section ref={ref} className="py-40 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <div className={`reveal ${isVisible ? "visible" : ""}`}>
          <h2 className="mb-6">
            准备好开启你的
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {" "}AI求职之旅
            </span>
            了吗？
          </h2>
          <p className="text-xl text-white/40 mb-12 max-w-xl mx-auto">
            免费注册，立即体验AI简历生成、岗位匹配和模拟面试。
            无需信用卡，3分钟即可完成第一份AI优化简历。
          </p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            whileHover={{ scale: 1.02 }}
          >
            <Link to="/register" className="btn-primary text-lg px-10 py-4">
              免费开始使用
            </Link>
            <a href="#features" className="btn-secondary text-lg px-10 py-4">
              了解更多
            </a>
          </motion.div>

          <p className="mt-8 text-sm text-white/20">
            已有 50,000+ 用户通过AI Career Copilot 找到理想工作
          </p>
        </div>
      </div>
    </section>
  );
}
