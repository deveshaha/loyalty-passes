import crypto from "crypto";

function base64url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function signQrPayload(payload: string) {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new Error("Missing QR_SECRET in env");

  const sig = crypto.createHmac("sha256", secret).update(payload).digest();
  return base64url(sig);
}

export function buildSignedQrToken(payload: string) {
  const sig = signQrPayload(payload);
  return `${payload}.${sig}`;
}

export function verifySignedQrToken(token: string) {
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return { ok: false as const, payload: null as string | null };

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  const expected = signQrPayload(payload);

  // timing safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return { ok: false as const, payload: null };

  const ok = crypto.timingSafeEqual(a, b);
  return { ok: ok as const, payload: ok ? payload : null };
}