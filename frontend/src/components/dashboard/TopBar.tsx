import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="h-14 glass border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/40">👋 {user.name || user.email || "用户"}</span>
        <button onClick={handleLogout} className="text-xs text-white/20 hover:text-white/50 transition-colors">退出</button>
      </div>
    </header>
  );
}
