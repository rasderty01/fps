// utils/token.ts
import { SignJWT, jwtVerify } from "jose";

// Secret key should be stored in environment variables
const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET!,
);

export const generateAccessToken = async (
  uploaderId: string,
  email: string,
) => {
  const token = await new SignJWT({ uploaderId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Token expires in 30 days
    .sign(SECRET_KEY);

  return token;
};

export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { uploaderId: string; email: string };
  } catch {
    return null;
  }
};
