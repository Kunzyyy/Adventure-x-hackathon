import { motion } from "framer-motion";
import ResumeTool from "../components/resume/ResumeTool";

export default function ResumePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <ResumeTool />
    </motion.div>
  );
}
