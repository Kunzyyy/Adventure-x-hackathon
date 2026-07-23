import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import KealPlatform from "./pages/KealPlatform";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DashboardHome from "./pages/DashboardHome";
import AIChatPage from "./pages/AIChatPage";
import ResumePage from "./pages/ResumePage";
import JobPage from "./pages/JobPage";
import InterviewPage from "./pages/InterviewPage";
import HistoryPage from "./pages/HistoryPage";
import AISettingsPage from "./pages/AISettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />}>
        <Route index element={<DashboardHome />} />
        <Route path="chat" element={<AIChatPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="job" element={<JobPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<AISettingsPage />} />
      </Route>
      <Route path="/keal" element={<KealPlatform />} />
    </Routes>
  );
}
