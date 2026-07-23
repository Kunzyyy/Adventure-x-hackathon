import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../components/keal/keal.css";
import StudentDashboard from "../components/keal/StudentDashboard";
import EnterpriseDashboard from "../components/keal/EnterpriseDashboard";

type Mode = "student" | "enterprise";

export default function KealPlatform() {
  const [mode, setMode] = useState<Mode>("student");

  return (
    <div className="keal-root">
      {/* ─── Top Navigation ─── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250, 250, 250, 0.78)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid var(--keal-border)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 40px",
          display: "flex", alignItems: "center", height: 64, gap: 24
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 16 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--keal-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: 16
            }}>
              K
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>
              Keal<span style={{ color: "var(--keal-accent)" }}>AI</span>
            </span>
          </div>

          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 400,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 12,
            background: "rgba(0, 0, 0, 0.03)",
            border: "1px solid var(--keal-border)",
          }}>
            <span style={{ fontSize: 14, color: "var(--keal-text-tertiary)" }}>🔎</span>
            <input
              type="text"
              placeholder="搜索岗位、公司、技能..."
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: 14, flex: 1, color: "var(--keal-text)",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Mode Toggle */}
          <div className="keal-mode-toggle">
            <button
              className={`keal-mode-btn ${mode === "student" ? "active" : ""}`}
              onClick={() => setMode("student")}
            >
              🎓 学生端
            </button>
            <button
              className={`keal-mode-btn ${mode === "enterprise" ? "active" : ""}`}
              onClick={() => setMode("enterprise")}
            >
              🏢 企业端
            </button>
          </div>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="keal-avatar keal-pulse" style={{
              width: 36, height: 36, fontSize: 14,
              background: "var(--keal-gradient)"
            }}>
              K
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Hi, Kael</div>
              <div style={{ fontSize: 11, color: "var(--keal-accent)", fontWeight: 600 }}>
                Lv.12
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div style={{ paddingTop: 32, paddingBottom: 40 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {mode === "student" ? <StudentDashboard /> : <EnterpriseDashboard />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Footer ─── */}
      <footer className="keal-footer">
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 40px"
        }}>
          {/* Ecosystem Banner */}
          <div style={{
            textAlign: "center", marginBottom: 48, padding: "48px 0",
            background: "var(--keal-gradient-subtle)",
            borderRadius: "var(--keal-radius)",
          }}>
            <h2 style={{
              fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em",
              marginBottom: 12
            }}>
              让每一次职业选择，都有
              <span className="keal-gradient-text"> AI 参与</span>
            </h2>
            <p style={{
              fontSize: 15, color: "var(--keal-text-secondary)",
              maxWidth: 500, margin: "0 auto 32px"
            }}>
              AI 驱动的职业生态系统，连接学生与企业，让合适的人找到合适的岗位。
            </p>

            <div style={{
              display: "flex", justifyContent: "center", gap: 48
            }}>
              {[
                { icon: "🎓", label: "学生成长", desc: "AI 职业规划与技能提升" },
                { icon: "🏢", label: "企业招聘", desc: "智能筛选与精准匹配" },
                { icon: "🤝", label: "AI 智能匹配", desc: "双向推荐 · 高效连接" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--keal-text-secondary)" }}>{item.desc}</div>
                  {i < 2 && (
                    <div style={{
                      marginTop: 12, fontSize: 20, color: "var(--keal-accent)", fontWeight: 800
                    }}>+</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 24, borderTop: "1px solid var(--keal-border)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: "var(--keal-gradient)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 800, fontSize: 12
              }}>
                K
              </div>
              <span style={{ fontSize: 13, color: "var(--keal-text-secondary)", fontWeight: 500 }}>
                © 2026 Keal AI. 让每一次职业选择，都有 AI 参与。
              </span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {["关于我们", "帮助中心", "隐私政策", "服务条款"].map((t) => (
                <a key={t} href="#" style={{
                  fontSize: 12, color: "var(--keal-text-tertiary)",
                  textDecoration: "none", fontWeight: 500
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--keal-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--keal-text-tertiary)")}
                >
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
