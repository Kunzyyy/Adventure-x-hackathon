import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

// In-memory store for demo (replace with DB in production)
const users: { email: string; passwordHash: string; name: string }[] = [];

authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    res.status(409).json({ error: "User already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ email, passwordHash, name });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({ token, user: { email, name } });
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user: { email, name: user.name } });
});
