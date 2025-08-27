import crypto from "crypto";

export const VERIFY_TTL_MS = 60 * 60 * 1000;


export const sha256 = (s: string) =>
crypto.createHash("sha256").update(s).digest("hex");


export const randomToken = (bytes = 32) =>
crypto.randomBytes(bytes).toString("hex");


export const expiryFromNow = (ms: number) => new Date(Date.now() + ms);