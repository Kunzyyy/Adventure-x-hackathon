import { motion } from "framer-motion";
import JobTool from "../components/resume/JobTool";

export default function JobPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <JobTool />
    </motion.div>
  );
}
