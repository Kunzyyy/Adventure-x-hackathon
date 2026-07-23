import { useScrollReveal } from "../hooks/useScrollReveal";

const STATS = [
  { value: "98%", label: "简历通过率", description: "AI优化后简历通过HR筛选的概率" },
  { value: "3.2x", label: "面试邀约", description: "相比未优化简历的面试邀约倍数" },
  { value: "50,000+", label: "已优化简历", description: "平台累计服务的求职者数量" },
  { value: "4.8/5", label: "用户评分", description: "来自真实用户的满意度评价" },
];

export default function Stats() {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className={`reveal text-center mb-20 ${isVisible ? "visible" : ""}`}>
          <h2 className="mb-4">数据证明实力</h2>
          <p className="text-xl text-white/40">用数字说话，每一个百分点都是用户的信任</p>
        </div>

        <div className={`reveal-stagger grid grid-cols-2 md:grid-cols-4 gap-8 ${isVisible ? "visible" : ""}`}>
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-500">
                {stat.value}
              </div>
              <div className="text-white/60 font-medium mb-2">{stat.label}</div>
              <div className="text-xs text-white/20 max-w-[180px] mx-auto">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
