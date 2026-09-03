import "server-only";

import { createHmac } from "node:crypto";

export const STUDY_CODE_COOKIE = "saa-study-code";
export const STUDY_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function normalizeStudyCode(value: string) {
  return value.trim().toUpperCase();
}

export function getStudyCodeHash(code: string) {
  const secret = process.env.STUDY_CODE_SECRET;
  if (!secret) {
    throw new Error("STUDY_CODE_SECRET is not configured");
  }

  return createHmac("sha256", secret).update(code).digest("hex");
}
