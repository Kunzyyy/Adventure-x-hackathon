import { defineConfig } from "vite";

// 专门用来本地预览根目录的 student.html（AI 求职助手页面）
// 不干扰 keal-mui 占用的 5173，这里用 5180
export default defineConfig({
  root: ".",
  server: {
    port: 5180,
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
