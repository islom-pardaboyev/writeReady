import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
  type DocumentReference,
} from "firebase-admin/firestore";

const MONTHLY_LIMIT = 12;
const ALLOWED_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 8000;

type CreditErrorCode = "USER_NOT_FOUND" | "NOT_PRO" | "LIMIT_REACHED";

class CreditError extends Error {
  constructor(public code: CreditErrorCode) {
    super(code);
  }
}

function initFirebase() {
  if (getApps().length) return;

  const projectId = 'writing-database-d0b7c';
  const clientEmail = 'firebase-adminsdk-fbsvc@writing-database-d0b7c.iam.gserviceaccount.com';
  const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDW5agXJ66Tmgek\nn3GmqjDmGmGEgPZgrHXL8biX3Mw8oRl//KUCYU79ZYZeuEWqqyd2ehrxADzx+fgh\n0/wNDJXWzAeVT0Z09yn0B+J8Gxwkrwlw08lpCvbi0t6M2I1gVUAWK8emL4Tm0ck0\n5oLeCDY5SvH987OytigY04Vqegh/xOP4o1VNXbdT6kLUoWe46hoFnX5wvMsKji6L\nSSqGIbtGWWHt5pV9GnHjSwWxjp61izoiBi8lwZV+6NyadHigorgH8xyMWLNmqyGe\nDUxq/U+PikC25iaz3CYzPlq/Eo+wf1dJphjE+YwCR1mDRMxkcclE1SAUREfjPLmk\n+ItrgAO9AgMBAAECggEACDDkwU0v6Excsjepm1KtXnfu85/+xByOuOFTyeYOmtkB\nIdG9cGPJIPt3rbCUZzby4B8zW7BIomiGvrNXzh+GrpNETrqg0uCA5t5OEbDu168c\nSwKnkKtsUaT7+p5edSeKs82jZIA3Lp0ccDnBDzl8554lrypU1SEAUkHtuetA263R\noxNWH+UPi3MnqBqT0vim5CzONjtTuy46L9GkpfomxsYFijANbVhJSzqXVsGPz6yI\n+qGx78TWEQX+Y3LAe1N0JKL/j8hhJWXhoCpZXA4886dR5224U2i9cBGDoMMR5kNZ\nu6CGAMZvTw1hwAT/xZmc6auXTwCo7wc803kQX1o5uQKBgQD3GTSUgiyVVAjM2c8a\nD1wfK7ekLpdTC3/K1eGvDlrdkx3PrisUB0WqmukcgCb0KtQXlhbLvC68Z0yxg+8s\nQ1/fZSaV4/c6sbzIqBKB7u54aShec63835HJ1ueEHuTcOgS+FJKuk34i3K961I21\noU7KeSXSTyHusyoKA3OjulksSwKBgQDeo3u/cBECyu2lMow2jDIrjD9h1pZoXfVy\n3weC4q+guyT+Plboafj92lQewWb+PtfcvUMpDXcx2yO1s2f+4UO4coPyzHXfaqD4\nn3zJaxZSI7CipaP/5qDEzzn4NiP/+5PPN7bPG4GNEW+dXD4uegcRUNwXMFVkFTSF\nIW2OFH97FwKBgHXoKRbUJsH6n1hgdlpRCfw1uCM3uC2ARzJabJ5Dk0g3cvoueY/N\nCIkn8iQPYocQCLRYgfgli4eLIyVxdyb/3zeR5J+Rb98qAJMe3/XwNQpv4ztup48K\nf154lXCN7VbIuIqa9oMnDgFEnNdXpWcN2bLzrAB2khJ8m4q7qupteS+RAoGAdqbr\n+W+RMUrS8fqJbTy0NC8vTEYfrIl+mPSxvRhwfxmdsn2otX5cu3VS5X0vFYqKYlLf\naw6JGqHuWxS89MI65B7roUdD/oiGN1pQF8whfi8VIOlkCKpxvdGu1FCOSQtbj9Di\ndWf0WCkVseiKHxzbjWfpk9YnfAotDlJtX44fDosCgYEApaFn/sKDTI4KTSq+nNlM\n4CQEbfHKHVzvbsO7MwpoAAk/f00phWCbaSI3v/cz6U7hCIQuaQegO6iZOw+q+kfl\nJ9jgu1CDliiMyAI/6tViLg8zDFEMlmGGlxuumRcw2SWCx3QQd010IEgG8K5JIo2G\nZA9tH6Q+B0mVgL+keM6jZI4=\n-----END PRIVATE KEY-----\n"

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Missing Firebase env vars. Got: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`,
    );
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
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
  const db = getFirestore();
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    initFirebase();
  } catch (e: any) {
    return res.status(500).json({ error: `Firebase init failed: ${e.message}` });
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
      max_tokens: Math.min(
        req.body.max_tokens ?? MAX_TOKENS_CAP,
        MAX_TOKENS_CAP,
      ),
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_CLAUDE_API_KEY || "",
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