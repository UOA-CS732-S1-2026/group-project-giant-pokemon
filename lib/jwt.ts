import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export function signToken(payload: any) {
  if (!SECRET) throw new Error("JWT_SECRET is missing");
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  if (!SECRET) throw new Error("JWT_SECRET is missing");
  return jwt.verify(token, SECRET);
}