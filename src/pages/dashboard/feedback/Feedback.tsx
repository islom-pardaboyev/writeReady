import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { decodeReport } from "@/lib/reportEncoding";
import { db, auth } from "@/firebase/firebase";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskData {
  report: string;
  createdAt: any;
  image?: string;
}

interface ReportData {
  task1?: TaskData;
  task2?: TaskData;
  userText1?: string;
  userText2?: string;
}

interface SentenceFeedback {
  sentence: string;
  feedback: string;
  bandScore: number;
  improvements: string;
}

interface BandScores {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overall: number;
}

interface VocabWord {
  word: string;
  definition: string;
  example: string;
  partOfSpeech: string;
}

interface GrammarStructure {
  name: string;
  explanation: string;
  template: string;
  example: string;
  usageNote: string;
}

interface TaskFeedback {
  taskNumber: 1 | 2;
  sentences: SentenceFeedback[];
  bandScores: BandScores;
  estimatedScore: number;
  generalComment: string;
  vocabulary: VocabWord[];
  grammarStructures: GrammarStructure[];
  sampleEssay: string;
}

// ─── API Call ─────────────────────────────────────────────────────────────────

async function analyzeTask(
  taskNumber: 1 | 2,
  prompt: string,
  userText: string,
  imageUrl?: string,
): Promise<TaskFeedback> {
  const taskType = taskNumber === 1 ? "Task 1 (Academic)" : "Task 2 (Essay)";

  // Kept intentionally compact — every extra instruction/example here is
  // billed as input tokens on every single request.
  const systemPrompt = `You are an IELTS examiner. Respond with ONLY valid JSON, no markdown fences, matching this exact shape:

{
  "taskNumber": ${taskNumber},
  "sentences": [{"sentence": "exact sentence from student text", "feedback": "plain, direct feedback citing one of: Task Achievement/Coherence/Lexical Resource/Grammar", "bandScore": 6.5, "improvements": "corrected version, natural and clear, no inflated vocabulary"}],
  "bandScores": {"taskAchievement": 6.0, "coherenceCohesion": 6.5, "lexicalResource": 6.0, "grammaticalRange": 6.5, "overall": 6.0},
  "estimatedScore": 6.5,
  "generalComment": "3-4 sentences: 1 specific strength with a sentence reference, 2 specific weaknesses with sentence references. No generic praise.",
  "vocabulary": [{"word": "topic-specific word, not generic", "definition": "short definition", "example": "natural sentence on this essay's topic", "partOfSpeech": "noun/verb/adjective/adverb"}],
  "grammarStructures": [{"name": "structure name", "explanation": "why it helps band score", "template": "pattern with placeholders", "example": "natural example sentence on this essay's topic", "usageNote": "when to use it"}],
  "sampleEssay": "a full band 8-9 sample answer to the same prompt, natural register, no purple prose"
}

Rules:
- sentences: split the student's text into every sentence, score each 0.5-9.0 in 0.5 steps.
- Feedback and improvements must use plain, natural language — clear and direct, not overly formal or showy. Favor accurate topic-relevant collocations over rare/inflated vocabulary.
- vocabulary: exactly 15 words, C1-C2, specific to this essay's topic (never "important", "however", "good", etc).
- grammarStructures: exactly 10 advanced structures (band 7-9) usable for THIS essay's topic specifically — not generic textbook examples.
- sampleEssay: one complete, natural band 8-9 response to the given prompt (intro, body, conclusion for Task 2; overview+details for Task 1). No filler words just to sound advanced.
- bandScores.overall = average of the 4 criteria. estimatedScore = your overall holistic band estimate for the whole essay (can match overall).
- Return ONLY the JSON object.`;

  const userContent: any[] = [];

  if (imageUrl && taskNumber === 1) {
    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      const mediaType = (blob.type || "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif";
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    } catch {
      console.warn("Image could not be loaded, skipping.");
    }
  }

  userContent.push({
    type: "text",
    text: `IELTS ${taskType} Question/Prompt:\n"${prompt}"\n\nStudent's Answer:\n"${userText || "(No answer provided)"}"

Analyze every sentence and return the complete JSON object.`,
  });

    const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must be signed in to get feedback.");
  const idToken = await currentUser.getIdToken();


  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
       Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Unknown API error");
  }

  const rawText: string = data.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text as string)
    .join("");

  const clean = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: TaskFeedback;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match)
      throw new Error("Could not parse AI response as JSON. Please try again.");
    parsed = JSON.parse(match[0]);
  }

  // Validate & normalise
  if (!Array.isArray(parsed.sentences)) parsed.sentences = [];
  if (!Array.isArray(parsed.vocabulary)) parsed.vocabulary = [];
  if (!Array.isArray(parsed.grammarStructures)) parsed.grammarStructures = [];
  if (!parsed.bandScores) {
    parsed.bandScores = {
      taskAchievement: 0,
      coherenceCohesion: 0,
      lexicalResource: 0,
      grammaticalRange: 0,
      overall: 0,
    };
  }
  if (typeof parsed.estimatedScore !== "number") {
    parsed.estimatedScore = parsed.bandScores.overall || 0;
  }
  if (!parsed.generalComment) parsed.generalComment = "";
  if (!parsed.sampleEssay) parsed.sampleEssay = "";

  return parsed;
}

// ─── Save Feedback to Firebase ────────────────────────────────────────────────

async function saveFeedbackToFirebase(
  taskFeedback: TaskFeedback,
  prompt: string,
  userText: string,
  imageUrl?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        console.warn("User not authenticated, skipping report save");
        resolve();
        return;
      }

      try {
        const reportsRef = collection(db, "users", user.uid, "reports");
        const newDocRef = doc(reportsRef);

        const essayLength =
          userText.trim() === "" ? 0 : userText.trim().split(/\s+/).length;

        await setDoc(newDocRef, {
          taskNumber: taskFeedback.taskNumber,
          prompt,
          userText,
          imageUrl: imageUrl || null,
          feedback: taskFeedback,
          createdAt: serverTimestamp(),
          essayLength,
        });

        console.log("✓ Report saved to Firebase:", newDocRef.id);
        resolve();
      } catch (error) {
        console.error("Failed to save report to Firebase:", error);
        reject(error);
      }
    });
  });
}

// ─── Generate & Download PDF ──────────────────────────────────────────────────

function generateAndDownloadPDF(
  taskNumber: 1 | 2,
  feedback: TaskFeedback,
  prompt: string,
  userText: string,
): void {
  const doc = new jsPDF();

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;

  let y = margin;

  // ── Header ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("WriteReady IELTS Feedback Report", margin, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(`Task ${taskNumber} · ${dateStr}`, pageW - margin, 10, {
    align: "right",
  });

  y = 36;

  // ── Estimated Score ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Estimated Band Score", margin + 3, y + 6);
  doc.setTextColor(37, 99, 235);
  doc.text(`${feedback.estimatedScore.toFixed(1)}`, pageW - margin - 10, y + 6);
  y += 14;

  // ── Band Scores Section ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Band Scores", margin + 3, y + 6);
  y += 14;

  const scores = [
    { label: "Task Achievement", score: feedback.bandScores.taskAchievement },
    {
      label: "Coherence & Cohesion",
      score: feedback.bandScores.coherenceCohesion,
    },
    { label: "Lexical Resource", score: feedback.bandScores.lexicalResource },
    {
      label: "Grammatical Range",
      score: feedback.bandScores.grammaticalRange,
    },
    { label: "OVERALL BAND", score: feedback.bandScores.overall },
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  scores.forEach((s) => {
    doc.setTextColor(15, 23, 42);
    doc.text(`${s.label}:`, margin + 3, y + 3);
    doc.setTextColor(s.score >= 7 ? 34 : 215, s.score >= 7 ? 197 : 130, 34);
    doc.setFont("helvetica", "bold");
    doc.text(`${s.score.toFixed(1)}`, pageW - margin - 10, y + 3);
    doc.setFont("helvetica", "normal");
    y += 5;
  });

  y += 4;

  // ── General Comment ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Examiner's Comment", margin + 3, y + 6);
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const commentLines = doc.splitTextToSize(
    feedback.generalComment,
    contentW - 6,
  );
  doc.setTextColor(15, 23, 42);
  doc.text(commentLines, margin + 3, y);
  y += commentLines.length * 4 + 8;

  if (y > pageH - 30) {
    doc.addPage();
    y = margin;
  }

  // ── Sample Essay Section ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Band 8-9 Sample Answer", margin + 3, y + 6);
  y += 12;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);
  const sampleLines = doc.splitTextToSize(
    feedback.sampleEssay || "(No sample generated)",
    contentW - 4,
  );
  sampleLines.forEach((line: string) => {
    if (y > pageH - 12) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin + 2, y);
    y += 3.6;
  });
  y += 6;

  if (y > pageH - 30) {
    doc.addPage();
    y = margin;
  }

  // ── Sentences Section ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Sentence-by-Sentence Analysis", margin + 3, y + 6);
  y += 12;

  doc.setFontSize(8);
  feedback.sentences.forEach((sent, idx) => {
    if (y > pageH - 20) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`S${idx + 1}:`, margin + 2, y);

    const sentenceLines = doc.splitTextToSize(sent.sentence, contentW - 12);
    doc.setFont("helvetica", "normal");
    doc.text(sentenceLines, margin + 10, y);
    y += sentenceLines.length * 3 + 1;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(64, 116, 179);
    doc.text(`Band: ${sent.bandScore.toFixed(1)}`, margin + 2, y);
    y += 3;

    doc.setTextColor(64, 64, 64);
    const fbLines = doc.splitTextToSize(sent.feedback, contentW - 4);
    doc.text(fbLines, margin + 2, y);
    y += fbLines.length * 3 + 2;

    if (sent.improvements) {
      doc.setTextColor(51, 153, 102);
      doc.setFont("helvetica", "bold");
      doc.text("Suggestion:", margin + 2, y);
      y += 3;
      doc.setFont("helvetica", "normal");
      const impLines = doc.splitTextToSize(sent.improvements, contentW - 4);
      doc.text(impLines, margin + 2, y);
      y += impLines.length * 3 + 4;
    }
  });

  if (y > pageH - 30) {
    doc.addPage();
    y = margin;
  }

  // ── Vocabulary Section ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Advanced Vocabulary", margin + 3, y + 6);
  y += 12;

  doc.setFontSize(8);
  feedback.vocabulary.forEach((word) => {
    if (y > pageH - 12) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text(`${word.word} (${word.partOfSpeech})`, margin + 2, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(64, 64, 64);
    const defLines = doc.splitTextToSize(word.definition, contentW - 4);
    doc.text(defLines, margin + 2, y);
    y += defLines.length * 2.5 + 1;

    const exLines = doc.splitTextToSize(`"${word.example}"`, contentW - 4);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.text(exLines, margin + 2, y);
    doc.setFont("helvetica", "normal");
    y += exLines.length * 2.5 + 3;
  });

  if (y > pageH - 30) {
    doc.addPage();
    y = margin;
  }

  // ── Grammar Structures Section ──
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentW, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Advanced Grammar Structures", margin + 3, y + 6);
  y += 12;

  doc.setFontSize(8);
  feedback.grammarStructures.forEach((gram, idx) => {
    if (y > pageH - 12) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text(`${idx + 1}. ${gram.name}`, margin + 2, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(64, 64, 64);
    doc.text(`Template:`, margin + 2, y);
    const tempLines = doc.splitTextToSize(gram.template, contentW - 4);
    doc.text(tempLines, margin + 8, y);
    y += tempLines.length * 2.5 + 1;

    const exLines = doc.splitTextToSize(`"${gram.example}"`, contentW - 4);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.text(exLines, margin + 2, y);
    doc.setFont("helvetica", "normal");
    y += exLines.length * 2.5 + 3;
  });

  // ── Footer ──
  const pages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("WriteReady IELTS Feedback", margin, pageH - 4);
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 4, {
      align: "right",
    });
  }

  doc.save(`WriteReady_Feedback_Task${taskNumber}.pdf`);
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function bandColor(score: number): string {
  if (score >= 7) return "#22c55e";
  if (score >= 5.5) return "#f59e0b";
  return "#ef4444";
}

// ─── VerdictSeal ──────────────────────────────────────────────────────────────
// The hero of each task panel — an "officially stamped" band score, so the
// headline number doesn't get lost among the four criteria circles below it.

function VerdictSeal({ score }: { score: number }) {
  const color = bandColor(score);
  return (
    <div className="wr-seal">
      <svg viewBox="0 0 120 120" className="wr-seal-ring" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeDasharray="2.5 4.5"
          opacity="0.55"
        />
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.85"
        />
      </svg>
      <div className="wr-seal-core">
        <span className="wr-seal-label">Estimated band</span>
        <span className="wr-seal-score" style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span className="wr-seal-of">out of 9.0</span>
      </div>
    </div>
  );
}

// ─── BandCircle ───────────────────────────────────────────────────────────────

function BandCircle({ score, label }: { score: number; label: string }) {
  const color = bandColor(score);
  const circumference = 2 * Math.PI * 24; // r=24 → ≈150.8
  const dash = (score / 9) * circumference;

  return (
    <div className="wr-band-circle">
      <svg viewBox="0 0 56 56" width="84" height="84">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="#1e293b"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
        <text
          x="28"
          y="33"
          textAnchor="middle"
          fill={color}
          fontSize="13"
          fontWeight="700"
        >
          {score.toFixed(1)}
        </text>
      </svg>
      <span className="wr-band-label">{label}</span>
    </div>
  );
}

// ─── SentenceCard ─────────────────────────────────────────────────────────────

function SentenceCard({
  item,
  index,
}: {
  item: SentenceFeedback;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const color = bandColor(item.bandScore);

  return (
    <div className="wr-sentence-card" style={{ borderLeftColor: color }}>
      <button className="wr-sentence-header" onClick={() => setOpen((o) => !o)}>
        <span className="wr-sentence-num">S{index + 1}</span>
        <span className="wr-sentence-text">{item.sentence}</span>
        <span className="wr-sentence-band" style={{ color }}>
          {item.bandScore.toFixed(1)}
        </span>
        <span className="wr-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="wr-sentence-body">
          <div className="wr-fb-block">
            <span className="wr-fb-tag">📋 Examiner Feedback</span>
            <p>{item.feedback}</p>
          </div>
          <div className="wr-fb-block wr-improve">
            <span className="wr-fb-tag">✏️ Suggested Rewrite</span>
            <p>{item.improvements}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GrammarCard ──────────────────────────────────────────────────────────────

function GrammarCard({ item, index }: { item: GrammarStructure; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="wr-grammar-card">
      <button className="wr-grammar-header" onClick={() => setOpen((o) => !o)}>
        <span className="wr-grammar-num">{index + 1}</span>
        <span className="wr-grammar-name">{item.name}</span>
        <span className="wr-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="wr-grammar-body">
          <div className="wr-grammar-row">
            <span className="wr-grammar-tag">💡 What it is</span>
            <p>{item.explanation}</p>
          </div>
          <div className="wr-grammar-row wr-template">
            <span className="wr-grammar-tag">🔧 Template</span>
            <p className="wr-template-text">{item.template}</p>
          </div>
          <div className="wr-grammar-row wr-example-row">
            <span className="wr-grammar-tag">✍️ Example</span>
            <p className="wr-example-text">"{item.example}"</p>
          </div>
          <div className="wr-grammar-row wr-usage-row">
            <span className="wr-grammar-tag">🎯 When to use</span>
            <p>{item.usageNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Flashcards + Match ───────────────────────────────────────────────────────

function VocabSection({ words }: { words: VocabWord[] }) {
  const [mode, setMode] = useState<"flashcard" | "match">("flashcard");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // ── Match state ──
  const MATCH_COUNT = 7;
  const [matchWords, setMatchWords] = useState<string[]>([]);
  const [matchDefs, setMatchDefs] = useState<string[]>([]);
  const [selWord, setSelWord] = useState<string | null>(null);
  const [selDef, setSelDef] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const initMatch = useCallback(() => {
    const slice = [...words]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(MATCH_COUNT, words.length));
    setMatchWords(
      [...slice.map((w) => w.word)].sort(() => Math.random() - 0.5),
    );
    setMatchDefs(
      [...slice.map((w) => w.definition)].sort(() => Math.random() - 0.5),
    );
    setSelWord(null);
    setSelDef(null);
    setMatched(new Set());
    setWrongKey(null);
  }, [words]);

  useEffect(() => {
    if (mode === "match") initMatch();
  }, [mode, initMatch]);

  // Check pair when both selected
  useEffect(() => {
    if (!selWord || !selDef) return;
    const correct = words.find((w) => w.definition === selDef)?.word;
    if (correct === selWord) {
      setMatched((prev) => new Set([...prev, selWord]));
      setSelWord(null);
      setSelDef(null);
    } else {
      const key = `${selWord}||${selDef}`;
      setWrongKey(key);
      setTimeout(() => {
        setWrongKey(null);
        setSelWord(null);
        setSelDef(null);
      }, 750);
    }
  }, [selWord, selDef, words]);

  const currentWord = words[cardIndex];

  const switchMode = (m: "flashcard" | "match") => {
    setMode(m);
    if (m === "flashcard") {
      setFlipped(false);
    }
  };

  return (
    <div className="wr-vocab-section">
      <div className="wr-vocab-tabs">
        <button
          className={`wr-vocab-tab ${mode === "flashcard" ? "active" : ""}`}
          onClick={() => switchMode("flashcard")}
        >
          🃏 Flashcards
        </button>
        <button
          className={`wr-vocab-tab ${mode === "match" ? "active" : ""}`}
          onClick={() => switchMode("match")}
        >
          🔗 Match Words
        </button>
      </div>

      {/* ── Flashcard mode ── */}
      {mode === "flashcard" && currentWord && (
        <div className="wr-flashcard-area">
          <div className="wr-progress-bar">
            <div
              className="wr-progress-fill"
              style={{ width: `${((cardIndex + 1) / words.length) * 100}%` }}
            />
          </div>
          <p className="wr-card-counter">
            {cardIndex + 1} / {words.length}
          </p>

          <div
            className={`wr-card ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
            role="button"
            aria-label="Flip card"
          >
            <div className="wr-card-inner">
              <div className="wr-card-front">
                <span className="wr-pos-badge">{currentWord.partOfSpeech}</span>
                <h3 className="wr-card-word">{currentWord.word}</h3>
                <p className="wr-card-hint">Tap to reveal definition</p>
              </div>
              <div className="wr-card-back">
                <p className="wr-card-def">{currentWord.definition}</p>
                <div className="wr-card-divider" />
                <p className="wr-card-example">"{currentWord.example}"</p>
              </div>
            </div>
          </div>

          <div className="wr-card-nav">
            <button
              className="wr-nav-btn"
              onClick={() => {
                setCardIndex((i) => Math.max(0, i - 1));
                setFlipped(false);
              }}
              disabled={cardIndex === 0}
            >
              ← Prev
            </button>
            <button
              className="wr-nav-btn wr-nav-btn--primary"
              onClick={() => {
                setCardIndex((i) => Math.min(words.length - 1, i + 1));
                setFlipped(false);
              }}
              disabled={cardIndex === words.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Match mode ── */}
      {mode === "match" && (
        <div className="wr-match-area">
          {matched.size > 0 && matched.size === matchWords.length ? (
            <div className="wr-match-win">
              <p className="wr-win-emoji">🎉</p>
              <p className="wr-win-text">
                All matched! Excellent vocabulary work.
              </p>
              <button
                className="wr-nav-btn wr-nav-btn--primary"
                onClick={initMatch}
              >
                Play Again
              </button>
            </div>
          ) : (
            <>
              <p className="wr-match-hint">
                Select a word, then its matching definition.
              </p>
              <div className="wr-match-columns">
                <div className="wr-match-col">
                  {matchWords.map((word) => {
                    const isMatched = matched.has(word);
                    const isSelected = selWord === word;
                    const isWrong = wrongKey?.startsWith(word + "||") ?? false;
                    return (
                      <button
                        key={word}
                        className={`wr-match-item${isMatched ? " matched" : ""}${isSelected ? " selected" : ""}${isWrong ? " wrong" : ""}`}
                        onClick={() =>
                          !isMatched && setSelWord(isSelected ? null : word)
                        }
                        disabled={isMatched}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
                <div className="wr-match-col">
                  {matchDefs.map((def) => {
                    const wordForDef =
                      words.find((w) => w.definition === def)?.word ?? "";
                    const isMatched = matched.has(wordForDef);
                    const isSelected = selDef === def;
                    const isWrong = wrongKey?.endsWith("||" + def) ?? false;
                    return (
                      <button
                        key={def}
                        className={`wr-match-item wr-match-def${isMatched ? " matched" : ""}${isSelected ? " selected" : ""}${isWrong ? " wrong" : ""}`}
                        onClick={() =>
                          !isMatched && setSelDef(isSelected ? null : def)
                        }
                        disabled={isMatched}
                      >
                        {def}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SampleEssay ──────────────────────────────────────────────────────────────

function SampleEssay({ text }: { text: string }) {
  const [open, setOpen] = useState(true);

  if (!text) return null;

  return (
    <div className="wr-sample-essay">
      <button className="wr-sample-header" onClick={() => setOpen((o) => !o)}>
        <span className="wr-sample-badge">Band 8–9</span>
        <span className="wr-sample-title">Sample Answer</span>
        <span className="wr-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="wr-sample-body">
          {text.split(/\n+/).filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TaskPanel ────────────────────────────────────────────────────────────────

type Tab = "scores" | "sentences" | "vocab" | "grammar";

function TaskPanel({
  taskNumber,
  feedback,
  loading,
  error,
  prompt,
  userText,
  imageUrl,
}: {
  taskNumber: 1 | 2;
  feedback: TaskFeedback | null;
  loading: boolean;
  error: string | null;
  prompt: string;
  userText: string;
  imageUrl?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("scores");

  if (loading) {
    return (
      <div className="wr-panel wr-loading-panel">
        <div className="wr-spinner" />
        <p>Analyzing Task {taskNumber}… this may take 20–40 seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wr-panel wr-error-panel">
        <span className="wr-error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!feedback) return null;

  const wordCount = userText.trim() ? userText.trim().split(/\s+/).length : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "scores", label: "📊 Band Scores" },
    { id: "sentences", label: "🔍 Sentences" },
    { id: "vocab", label: "📚 Vocabulary" },
    { id: "grammar", label: "🧠 Grammar" },
  ];

  return (
    <div className="wr-panel">
      {/* Hero — the verdict, front and center */}
      <div className="wr-panel-hero">
        <VerdictSeal score={feedback.estimatedScore} />
        <div className="wr-hero-copy">
          <span className="wr-task-badge">
            Task {taskNumber} · {taskNumber === 1 ? "Academic Report" : "Essay"}
          </span>
          <p className="wr-general-comment">{feedback.generalComment}</p>
          <div className="wr-meta-row">
            <span>{wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span>{feedback.sentences.length} sentences scored</span>
            {imageUrl && taskNumber === 1 && (
              <span className="wr-meta-chip">Diagram included</span>
            )}
          </div>
        </div>
      </div>

      {/* Original prompt — tucked away, since the writer already knows it */}
      <details className="wr-prompt-disclosure" open>
        <summary>View the original prompt{imageUrl ? " & diagram" : ""}</summary>
        <div className="wr-prompt-box">
          {imageUrl && taskNumber === 1 && (
            <img
              src={imageUrl}
              alt="Task 1 diagram"
              className="wr-task-image"
            />
          )}
          <p className="wr-prompt-text">{prompt}</p>
        </div>
      </details>

      {/* Sample essay shown up front, before the tabs */}
      <div style={{ padding: "0 28px 18px" }}>
        <SampleEssay text={feedback.sampleEssay} />
      </div>

      {/* Tabs */}
      <div className="wr-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            className={`wr-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Band Scores */}
      {activeTab === "scores" && (
        <div className="wr-scores-grid">
          <BandCircle
            score={feedback.bandScores.taskAchievement}
            label={taskNumber === 1 ? "Task Achievement" : "Task Response"}
          />
          <BandCircle
            score={feedback.bandScores.coherenceCohesion}
            label="Coherence & Cohesion"
          />
          <BandCircle
            score={feedback.bandScores.lexicalResource}
            label="Lexical Resource"
          />
          <BandCircle
            score={feedback.bandScores.grammaticalRange}
            label="Grammar & Accuracy"
          />
        </div>
      )}

      {/* Sentence Analysis */}
      {activeTab === "sentences" && (
        <div className="wr-sentences-list">
          {feedback.sentences.length === 0 ? (
            <p className="wr-empty">No sentences to analyze.</p>
          ) : (
            feedback.sentences.map((s, i) => (
              <SentenceCard key={i} item={s} index={i} />
            ))
          )}
        </div>
      )}

      {/* Vocabulary */}
      {activeTab === "vocab" &&
        (feedback.vocabulary.length === 0 ? (
          <p className="wr-empty" style={{ padding: "24px" }}>
            No vocabulary generated.
          </p>
        ) : (
          <VocabSection words={feedback.vocabulary} />
        ))}

      {/* Grammar Structures */}
      {activeTab === "grammar" && (
        <div className="wr-grammar-list">
          <p className="wr-grammar-intro">
            10 advanced structures for Band 7–9, curated for your essay topic.
          </p>
          {feedback.grammarStructures.length === 0 ? (
            <p className="wr-empty">No grammar structures generated.</p>
          ) : (
            feedback.grammarStructures.map((g, i) => (
              <GrammarCard key={i} item={g} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Feedback() {
  const { report } = useParams<{ report: string }>();

  const [data, setData] = useState<ReportData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [noTaskError, setNoTaskError] = useState<string | null>(null);

  const [feedback1, setFeedback1] = useState<TaskFeedback | null>(null);
  const [feedback2, setFeedback2] = useState<TaskFeedback | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!report) throw new Error("Missing report parameter.");
      const decoded = decodeReport(report);
      setData(decoded);
    } catch {
      setParseError(
        "Could not load your report. Please go back and try again.",
      );
    }
  }, [report]);

  const hasTask1 = !!(data?.task1?.report && data?.userText1?.trim());
  const hasTask2 = !!(data?.task2?.report && data?.userText2?.trim());

  const runAnalysis = useCallback(async () => {
    if (!data) return;

    const t1 = !!(data.task1?.report && data.userText1?.trim());
    const t2 = !!(data.task2?.report && data.userText2?.trim());

    if (!t1 && !t2) {
      setNoTaskError(
        "Tahlil qilish uchun hech qanday insho topilmadi. Iltimos, orqaga qaytib qaytadan urinib ko'ring.",
      );
      return;
    }
    setNoTaskError(null);

    const promises: Promise<void>[] = [];

    if (t1) {
      setLoading1(true);
      setError1(null);
      promises.push(
        analyzeTask(1, data.task1!.report, data.userText1!, data.task1!.image)
          .then(async (feedback) => {
            setFeedback1(feedback);
            await saveFeedbackToFirebase(
              feedback,
              data.task1!.report,
              data.userText1!,
              data.task1!.image,
            );
          })
          .catch((e: Error) =>
            setError1(
              e.message || "Failed to analyze Task 1. Please try again.",
            ),
          )
          .finally(() => setLoading1(false)),
      );
    }

    if (t2) {
      setLoading2(true);
      setError2(null);
      promises.push(
        analyzeTask(2, data.task2!.report, data.userText2!)
          .then(async (feedback) => {
            setFeedback2(feedback);
            await saveFeedbackToFirebase(
              feedback,
              data.task2!.report,
              data.userText2!,
            );
          })
          .catch((e: Error) =>
            setError2(
              e.message || "Failed to analyze Task 2. Please try again.",
            ),
          )
          .finally(() => setLoading2(false)),
      );
    }

    await Promise.allSettled(promises);
  }, [data]);

  useEffect(() => {
    if (data) {
      runAnalysis();
    }
  }, [data, runAnalysis]);

  const handleDownloadPDF = () => {
    if (feedback1 && data?.task1 && data?.userText1) {
      generateAndDownloadPDF(1, feedback1, data.task1.report, data.userText1);
    }
    if (feedback2 && data?.task2 && data?.userText2) {
      generateAndDownloadPDF(2, feedback2, data.task2.report, data.userText2);
    }
  };

  const canDownload = !!(feedback1 || feedback2);

  const subline =
    hasTask1 && hasTask2
      ? "Sentence analysis · Band scores · 15 vocabulary words · 10 grammar structures"
      : hasTask1
        ? "Task 1 feedback · Band scores · 15 vocabulary words · 10 grammar structures"
        : "Task 2 feedback · Band scores · 15 vocabulary words · 10 grammar structures";

  if (parseError) {
    return (
      <>
        <style>{styles}</style>
        <div className="wr-root">
          <div className="wr-error-fullpage">
            <span style={{ fontSize: 40 }}>⚠️</span>
            <p>{parseError}</p>
          </div>
        </div>
      </>
    );
  }

  if (noTaskError) {
    return (
      <>
        <style>{styles}</style>
        <div className="wr-root">
          <div className="wr-error-fullpage">
            <span style={{ fontSize: 40 }}>⚠️</span>
            <p>{noTaskError}</p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <style>{styles}</style>
        <div className="wr-root">
          <div className="wr-loading-center">
            <div className="wr-spinner" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="wr-root">
        {/* ── Report strip — page context, not a second nav bar ── */}
        <div className="wr-report-strip">
          <div className="wr-report-strip-inner">
            <div>
              <p className="wr-eyebrow">AI Examiner Report</p>
              <p className="wr-report-sub">{subline}</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={!canDownload}
              className="wr-download-btn"
              title={canDownload ? undefined : "Available once your feedback is ready"}
            >
              <span aria-hidden="true">⇩</span> Download PDF
            </button>
          </div>
        </div>

        <div className="wr-panels">
          {(loading1 || loading2) && (
            <div className="wr-status-banner">
              <span className="wr-status-pill">
                AI feedback is starting automatically
              </span>
              <p>
                WriteReady is analyzing your essay
                {hasTask1 && hasTask2 ? "s" : ""} now. This usually takes a few
                seconds.
              </p>
            </div>
          )}

          {hasTask1 && (
            <TaskPanel
              taskNumber={1}
              feedback={feedback1}
              loading={loading1}
              error={error1}
              prompt={data.task1!.report}
              userText={data.userText1 ?? ""}
              imageUrl={data.task1!.image}
            />
          )}
          {hasTask2 && (
            <TaskPanel
              taskNumber={2}
              feedback={feedback2}
              loading={loading2}
              error={error2}
              prompt={data.task2!.report}
              userText={data.userText2 ?? ""}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,600;1,400&family=JetBrains+Mono:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .wr-root {
    min-height: 100vh;
    background:
      radial-gradient(circle at top, rgba(191,219,254,0.35), rgba(248,250,252,0) 28%),
      linear-gradient(180deg, #f8fbff 0%, #ffffff 45%, #eff6ff 100%);
    color: #0f172a;
    font-family: 'Inter', sans-serif;
    padding-bottom: 80px;
  }

  /* ── Report strip ── */
  .wr-report-strip {
    border-bottom: 1px solid #dbeafe;
    background: rgba(255,255,255,0.7);
  }
  .wr-report-strip-inner {
    max-width: 980px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 18px 20px;
  }
  .wr-eyebrow {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.25em; color: #2563eb; margin-bottom: 4px;
  }
  .wr-report-sub { font-size: 13px; color: #64748b; }
  .wr-download-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 8px;
    font-size: 14px; font-weight: 600;
    border: none; cursor: pointer; white-space: nowrap;
    background: #2563eb; color: #fff;
    box-shadow: 0 4px 14px rgba(37,99,235,0.25);
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  .wr-download-btn:hover:not(:disabled) {
    background: #1d4ed8; transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(37,99,235,0.35);
  }
  .wr-download-btn:disabled {
    background: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none;
  }

  .wr-status-banner {
    background: linear-gradient(135deg, #eff6ff, #ffffff);
    border: 1px solid #bfdbfe;
    border-radius: 18px;
    padding: 14px 16px;
    box-shadow: 0 10px 24px rgba(148,163,184,0.12);
  }
  .wr-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #dbeafe;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    margin-bottom: 8px;
  }
  .wr-status-banner p {
    color: #334155;
    font-size: 13px;
    line-height: 1.5;
  }

  /* ── Panels ── */
  .wr-panels {
    max-width: 980px; margin: 28px auto 0;
    padding: 0 14px;
    display: flex; flex-direction: column; gap: 24px;
  }
  .wr-panel {
    background: rgba(255,255,255,0.96); border: 1px solid #dbeafe;
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 18px 40px rgba(148,163,184,0.14);
  }

  /* ── Panel Hero (verdict seal + comment) ── */
  .wr-panel-hero {
    display: flex; align-items: center; gap: 24px;
    padding: 28px 28px 20px;
  }
  .wr-hero-copy { flex: 1; min-width: 0; }
  .wr-task-badge {
    display: inline-block;
    background: #eff6ff; color: #1d4ed8;
    font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    padding: 4px 10px; border-radius: 999px;
    border: 1px solid #bfdbfe; margin-bottom: 10px;
  }
  .wr-general-comment {
    font-size: 14px; color: #334155; line-height: 1.7;
  }
  .wr-meta-row {
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    margin-top: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #64748b; letter-spacing: 0.02em;
  }
  .wr-meta-chip {
    background: #eff6ff; color: #1d4ed8;
    padding: 2px 8px; border-radius: 999px;
    font-family: 'Inter', sans-serif; font-weight: 600;
  }

  /* ── Verdict Seal ── */
  .wr-seal {
    position: relative; width: 124px; height: 124px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transform: rotate(-4deg);
  }
  .wr-seal-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
  .wr-seal-core { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .wr-seal-label {
    font-size: 8.5px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: #64748b;
  }
  .wr-seal-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 30px; font-weight: 700; line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }
  .wr-seal-of { font-size: 9px; color: #94a3b8; }

  /* ── Prompt disclosure ── */
  .wr-prompt-disclosure {
    margin: 0 28px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
  }
  .wr-prompt-disclosure summary {
    list-style: none; cursor: pointer;
    padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: #475569;
    display: flex; align-items: center; justify-content: space-between;
  }
  .wr-prompt-disclosure summary::-webkit-details-marker { display: none; }
  .wr-prompt-disclosure summary::after {
    content: "▾"; color: #94a3b8; transition: transform 0.2s ease;
  }
  .wr-prompt-disclosure[open] summary::after { transform: rotate(180deg); }
  .wr-prompt-disclosure .wr-prompt-box {
    margin: 0; border: none; border-top: 1px solid #e2e8f0;
    border-radius: 0 0 12px 12px; background: transparent;
  }
  .wr-task-image {
    width: 100%; max-height: 260px;
    object-fit: contain; border-radius: 8px; margin-bottom: 12px;
  }
  .wr-prompt-box { padding: 14px; }
  .wr-prompt-text {
    font-size: 13px; color: #475569; line-height: 1.65; font-style: italic;
  }

  /* ── Sample Essay ── */
  .wr-sample-essay {
    background: #07111f; border: 1px solid #1a3458;
    border-left: 3px solid #2563eb; border-radius: 10px; overflow: hidden;
  }
  .wr-sample-header {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 14px; background: none; border: none;
    color: #e2e8f0; cursor: pointer; width: 100%; text-align: left;
  }
  .wr-sample-header:hover { background: #0d1e36; }
  .wr-sample-badge {
    background: #1d4ed8; color: #dbeafe;
    font-size: 10px; font-weight: 700;
    padding: 3px 8px; border-radius: 999px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .wr-sample-title { flex: 1; font-size: 14px; font-weight: 600; color: #93c5fd; }
  .wr-sample-body {
    padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 10px;
  }
  .wr-sample-body p {
    font-size: 13px; line-height: 1.75; color: #b0c8e8;
  }

  /* ── Tabs ── */
  .wr-tabs {
    display: flex; border-bottom: 1px solid #e5eefb;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .wr-tabs::-webkit-scrollbar { display: none; }
  .wr-tab {
    flex: 1; min-width: 100px; padding: 13px 6px;
    background: none; border: none;
    color: #64748b; font-size: 12px; font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .wr-tab:hover { color: #1d4ed8; }
  .wr-tab.active { color: #1d4ed8; border-bottom-color: #2563eb; }

  /* ── Band Scores ── */
  .wr-scores-grid {
    display: flex; flex-wrap: wrap;
    gap: 20px; padding: 28px 24px;
    justify-content: center; align-items: center;
  }
  .wr-band-circle {
    display: flex; flex-direction: column;
    align-items: center; gap: 8px;
  }
  .wr-band-label {
    font-size: 11px; color: #4a6080;
    text-align: center; max-width: 80px; line-height: 1.35;
  }

  /* ── Sentence Analysis ── */
  .wr-sentences-list {
    padding: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .wr-sentence-card {
    background: #07111f; border: 1px solid #1a3458;
    border-left: 3px solid; border-radius: 10px; overflow: hidden;
  }
  .wr-sentence-header {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 12px 14px; background: none; border: none;
    color: #e2e8f0; cursor: pointer; width: 100%; text-align: left;
  }
  .wr-sentence-header:hover { background: #0d1e36; }
  .wr-sentence-num {
    flex-shrink: 0; font-size: 10px; font-weight: 700;
    color: #4a6080; background: #112240;
    padding: 2px 6px; border-radius: 4px; margin-top: 2px;
  }
  .wr-sentence-text { flex: 1; font-size: 13px; line-height: 1.6; color: #b0c8e8; }
  .wr-sentence-band {
    flex-shrink: 0; font-size: 13px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .wr-chevron { flex-shrink: 0; font-size: 9px; color: #4a6080; margin-top: 4px; }
  .wr-sentence-body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 10px; }
  .wr-fb-block {
    background: #0d1e36; border-radius: 8px; padding: 12px 14px;
  }
  .wr-improve { border: 1px solid rgba(34,197,94,0.15); }
  .wr-fb-tag {
    display: block; font-size: 10px; font-weight: 700;
    color: #4a6080; margin-bottom: 6px;
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .wr-fb-block p { font-size: 13px; line-height: 1.65; color: #7a9abf; }
  .wr-improve p { color: #86efac; }

  /* ── Vocabulary section ── */
  .wr-vocab-section { padding: 18px; }
  .wr-vocab-tabs {
    display: flex; gap: 8px; margin-bottom: 18px;
  }
  .wr-vocab-tab {
    flex: 1; padding: 10px; background: #07111f;
    border: 1px solid #1a3458; border-radius: 10px;
    color: #4a6080; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .wr-vocab-tab:hover { color: #7a9abf; border-color: rgba(37,99,235,0.3); }
  .wr-vocab-tab.active {
    background: #0c2040; border-color: #2563eb; color: #60a5fa;
  }

  /* ── Flashcard ── */
  .wr-flashcard-area { text-align: center; }
  .wr-progress-bar {
    background: #1a3458; height: 4px; border-radius: 2px;
    margin-bottom: 8px; overflow: hidden;
  }
  .wr-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #2563eb, #60a5fa);
    border-radius: 2px; transition: width 0.3s ease;
  }
  .wr-card-counter {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #4a6080; margin-bottom: 18px;
  }
  .wr-card {
    perspective: 1100px; height: 210px;
    cursor: pointer; margin-bottom: 18px;
  }
  .wr-card-inner {
    position: relative; width: 100%; height: 100%;
    transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
    transform-style: preserve-3d;
  }
  .wr-card.flipped .wr-card-inner { transform: rotateY(180deg); }
  .wr-card-front, .wr-card-back {
    position: absolute; inset: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    border-radius: 16px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 22px; gap: 10px;
  }
  .wr-card-front {
    background: linear-gradient(135deg, #0c2040, #1a3a6e);
    border: 1px solid rgba(37,99,235,0.25);
  }
  .wr-card-back {
    transform: rotateY(180deg);
    background: linear-gradient(135deg, #0c2a18, #163824);
    border: 1px solid rgba(34,197,94,0.2);
  }
  .wr-pos-badge {
    font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
    color: #60a5fa; background: #112240;
    padding: 3px 8px; border-radius: 4px; font-weight: 600;
  }
  .wr-card-word {
    font-family: 'Lora', serif; font-size: 26px;
    color: #f1f5f9; font-weight: 600;
  }
  .wr-card-hint { font-size: 12px; color: #4a6080; margin-top: 4px; }
  .wr-card-def {
    font-size: 15px; color: #86efac;
    text-align: center; line-height: 1.5; font-weight: 500;
  }
  .wr-card-divider { width: 36px; height: 1px; background: rgba(34,197,94,0.25); }
  .wr-card-example {
    font-size: 12px; color: #7a9abf;
    text-align: center; line-height: 1.5; font-style: italic;
  }
  .wr-card-nav { display: flex; justify-content: center; gap: 10px; }
  .wr-nav-btn {
    padding: 10px 22px;
    background: #07111f; border: 1px solid #1a3458;
    border-radius: 8px; color: #7a9abf;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .wr-nav-btn:hover:not(:disabled) { border-color: #2563eb; color: #60a5fa; }
  .wr-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .wr-nav-btn--primary {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-color: transparent; color: #fff;
    box-shadow: 0 2px 12px rgba(37,99,235,0.3);
  }
  .wr-nav-btn--primary:hover:not(:disabled) {
    box-shadow: 0 4px 20px rgba(37,99,235,0.5);
    transform: translateY(-1px);
  }

  /* ── Match Game ── */
  .wr-match-area {}
  .wr-match-hint {
    font-size: 13px; color: #4a6080;
    text-align: center; margin-bottom: 14px;
  }
  .wr-match-columns {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  .wr-match-col { display: flex; flex-direction: column; gap: 7px; }
  .wr-match-item {
    padding: 10px 11px;
    background: #07111f; border: 1px solid #1a3458;
    border-radius: 8px; color: #7a9abf;
    font-size: 12px; font-weight: 500;
    cursor: pointer; text-align: left;
    transition: all 0.12s; line-height: 1.4;
  }
  .wr-match-item:hover:not(:disabled) { border-color: #2563eb; color: #60a5fa; }
  .wr-match-item.selected { border-color: #2563eb; background: #0c2040; color: #60a5fa; }
  .wr-match-item.matched  { border-color: #22c55e; background: #071a0f; color: #4ade80; opacity: 0.75; cursor: default; }
  .wr-match-item.wrong    { border-color: #ef4444; background: #1a0707; color: #f87171; animation: shake 0.4s; }
  .wr-match-def { font-size: 11px; color: #4a6080; }
  .wr-match-def.selected { color: #60a5fa; }
  .wr-match-def.matched  { color: #4ade80; }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25%, 75%  { transform: translateX(-5px); }
    50%       { transform: translateX(5px); }
  }
  .wr-match-win {
    text-align: center; padding: 40px 0;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .wr-win-emoji { font-size: 46px; }
  .wr-win-text  { font-size: 16px; color: #86efac; font-weight: 500; }

  /* ── Grammar Structures ── */
  .wr-grammar-list { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .wr-grammar-intro {
    font-size: 13px; color: #4a6080; margin-bottom: 8px;
    padding: 10px 12px; background: #07111f;
    border-radius: 8px; border: 1px solid #1a3458;
  }
  .wr-grammar-card {
    background: #07111f; border: 1px solid #1a3458;
    border-left: 3px solid #7c3aed; border-radius: 10px; overflow: hidden;
  }
  .wr-grammar-header {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 14px; background: none; border: none;
    color: #e2e8f0; cursor: pointer; width: 100%; text-align: left;
  }
  .wr-grammar-header:hover { background: #0d1e36; }
  .wr-grammar-num {
    flex-shrink: 0; width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    background: #2a1560; color: #a78bfa;
    font-size: 11px; font-weight: 700;
    border-radius: 50%; border: 1px solid #4c1d95;
  }
  .wr-grammar-name { flex: 1; font-size: 14px; font-weight: 600; color: #c4b5fd; }
  .wr-grammar-body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 10px; }
  .wr-grammar-row { background: #0d1e36; border-radius: 8px; padding: 12px 14px; }
  .wr-grammar-tag {
    display: block; font-size: 10px; font-weight: 700;
    color: #4a6080; margin-bottom: 6px;
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .wr-grammar-row p { font-size: 13px; line-height: 1.65; color: #7a9abf; }
  .wr-template { border: 1px solid rgba(124,58,237,0.2); }
  .wr-template-text { color: #c4b5fd !important; font-family: monospace; font-size: 13px !important; }
  .wr-example-row { border: 1px solid rgba(251,191,36,0.15); }
  .wr-example-text { color: #fde68a !important; font-style: italic; }
  .wr-usage-row { border: 1px solid rgba(34,197,94,0.12); }
  .wr-usage-row p { color: #86efac !important; }

  /* ── Loading / Error states ── */
  .wr-loading-panel, .wr-error-panel {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 56px 24px; gap: 14px; text-align: center;
  }
  .wr-loading-panel { color: #4a6080; font-size: 14px; }
  .wr-error-panel   { color: #f87171; font-size: 14px; }
  .wr-error-icon    { font-size: 32px; }
  .wr-spinner {
    width: 34px; height: 34px;
    border: 3px solid #1a3458; border-top-color: #2563eb;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .wr-loading-center {
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh;
  }
  .wr-error-fullpage {
    max-width: 380px; margin: 80px auto;
    text-align: center; color: #f87171;
    font-size: 14px; line-height: 1.6;
    display: flex; flex-direction: column; gap: 12px; align-items: center;
  }
  .wr-empty {
    color: #4a6080; font-size: 14px; text-align: center; padding: 20px 0;
  }

  /* ── Mobile ── */
  @media (max-width: 560px) {
    .wr-report-strip-inner { flex-direction: column; align-items: stretch; text-align: center; }
    .wr-download-btn { justify-content: center; }
    .wr-panel-hero { flex-direction: column; text-align: center; padding: 24px 18px 16px; }
    .wr-prompt-disclosure { margin: 0 18px 16px; }
    .wr-sentences-list, .wr-scores-grid, .wr-vocab-section, .wr-grammar-list { padding: 12px; }
    .wr-scores-grid { gap: 16px; }
    .wr-card-word { font-size: 22px; }
    .wr-seal { width: 104px; height: 104px; }
    .wr-seal-score { font-size: 26px; }
    .wr-match-item { font-size: 11px; padding: 8px 9px; }
  }
`;

export default Feedback;