import { motion } from "framer-motion";
import InterviewTool from "../components/interview/InterviewTool";

export default function InterviewPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <InterviewTool />
    </motion.div>
  );
}
