import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/response.js";

export async function register(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_EXISTS", "A user with this email already exists");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });
  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "12h" });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "12h" });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}
