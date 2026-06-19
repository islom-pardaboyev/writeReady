import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
  type DocumentReference,
} from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

const MONTHLY_LIMIT = 12;

const ALLOWED_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 8000;


type CreditErrorCode = "USER_NOT_FOUND" | "NOT_PRO" | "LIMIT_REACHED";

class CreditError extends Error {
  constructor(public code: CreditErrorCode) {
    super(code);
  }
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isProUser(subscription: unknown): boolean {
  if (subscription === "forever") return true;
  if (typeof subscription !== "string") return false;
  const expiry = new Date(subscription);
  return !Number.isNaN(expiry.getTime()) && expiry > new Date();
}

async function getUid(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("MISSING_TOKEN");
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

function validateBody(body: any): string | null {
  if (!body || typeof body !== "object") return "Request body bo'sh";
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return "messages massivi kerak";
  }
  return null;
}

async function consumeCredit(
  uid: string,
  monthKey: string,
): Promise<DocumentReference> {
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new CreditError("USER_NOT_FOUND");

    const data = snap.data()!;
    if (!isProUser(data.subscription)) throw new CreditError("NOT_PRO");

    const usage = data.usage || {};
    const used = usage.monthKey === monthKey ? usage.count || 0 : 0;

    if (used >= MONTHLY_LIMIT) throw new CreditError("LIMIT_REACHED");

    tx.set(userRef, { usage: { monthKey, count: used + 1 } }, { merge: true });
  });

  return userRef;
}

async function refundCredit(userRef: DocumentReference, monthKey: string) {
  await userRef.set(
    { usage: { monthKey, count: FieldValue.increment(-1) } },
    { merge: true },
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let uid: string;
  try {
    uid = await getUid(req);
  } catch {
    return res.status(401).json({ error: "Invalid or missing auth token" });
  }

  const bodyError = validateBody(req.body);
  if (bodyError) {
    return res.status(400).json({ error: bodyError });
  }

  const monthKey = currentMonthKey();

  let userRef: DocumentReference;
  try {
    userRef = await consumeCredit(uid, monthKey);
  } catch (e) {
    if (e instanceof CreditError) {
      if (e.code === "NOT_PRO") {
        return res.status(403).json({ error: "Pro obuna kerak" });
      }
      if (e.code === "LIMIT_REACHED") {
        return res.status(429).json({ error: "Oylik limit tugadi" });
      }
      if (e.code === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      }
    }
    return res.status(500).json({ error: "Limit tekshirishda xato" });
  }

  try {
    const payload = {
      ...req.body,
      model: ALLOWED_MODEL,
      max_tokens: Math.min(req.body.max_tokens ?? MAX_TOKENS_CAP, MAX_TOKENS_CAP),
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      await refundCredit(userRef, monthKey);
    }

    return res.status(response.status).json(data);
  } catch (error: any) {
    await refundCredit(userRef, monthKey);
    return res.status(500).json({ error: error.message });
  }
}