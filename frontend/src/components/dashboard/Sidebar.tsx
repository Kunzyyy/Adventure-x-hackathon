import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "工作台", icon: "⬚", end: true },
  { to: "/dashboard/chat", label: "AI 对话", icon: "🤖" },
  { to: "/dashboard/resume", label: "简历生成", icon: "📄" },
  { to: "/dashboard/job", label: "岗位匹配", icon: "🔍" },
  { to: "/dashboard/interview", label: "模拟面试", icon: "💬" },
  { to: "/dashboard/history", label: "面试历史", icon: "📋" },
];

const BOTTOM_ITEMS = [
  { to: "/dashboard/settings", label: "AI 模型配置", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-black/40 border-r border-white/5 flex flex-col py-8 flex-shrink-0">
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">AI</span>
          </div>
          <span className="text-sm font-semibold text-white/60">Copilot</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-500/10 text-blue-400 font-medium"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 space-y-1 pt-4 border-t border-white/5 mx-3">
        {BOTTOM_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-500/10 text-blue-400 font-medium"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      <div className="px-5 pt-4">
        <p className="text-[10px] text-white/15 uppercase tracking-wider">v0.2</p>
      </div>
    </aside>
  );
}
