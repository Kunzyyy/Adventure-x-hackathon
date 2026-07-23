import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="font-semibold text-white/90 text-sm">
            Career Copilot
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["功能", "数据", "定价", "关于"].map((item) => (
            <a
              key={item}
              href={`#${item === "功能" ? "features" : item === "数据" ? "stats" : ""}`}
              className="text-sm text-white/50 hover:text-white transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </div>

        <Link to="/register" className="btn-primary text-sm py-2 px-5">
          开始使用
        </Link>
      </div>
    </motion.nav>
  );
}
