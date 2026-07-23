import { motion } from "framer-motion";
import InterviewHistory from "../components/interview/InterviewHistory";

export default function HistoryPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <InterviewHistory />
    </motion.div>
  );
}
