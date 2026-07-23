export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <span className="text-sm text-white/40">AI Career Copilot</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/20">
            <a href="#" className="hover:text-white/50 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-white/50 transition-colors">服务条款</a>
            <a href="#" className="hover:text-white/50 transition-colors">联系我们</a>
          </div>

          <p className="text-xs text-white/15">
            © 2026 AI Career Copilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
