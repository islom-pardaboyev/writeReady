import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  TaskFeedback,
  SentenceFeedback,
  VocabWord,
  GrammarStructure,
  BandScores,
} from "@/lib/types";

// ─── BandCircle ───────────────────────────────────────────────────────────────

function BandCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 7 ? "#22c55e" : score >= 5.5 ? "#f59e0b" : "#ef4444";
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
  const color =
    item.bandScore >= 7
      ? "#22c55e"
      : item.bandScore >= 5.5
        ? "#f59e0b"
        : "#ef4444";

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

function GrammarCard({
  item,
  index,
}: {
  item: GrammarStructure;
  index: number;
}) {
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

// ─── VocabSection ─────────────────────────────────────────────────────────────

function VocabSection({ words }: { words: VocabWord[] }) {
  const [mode, setMode] = useState<"flashcard" | "match">("flashcard");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentWord = words[cardIndex];

  return (
    <div className="wr-vocab-section">
      <div className="wr-vocab-tabs">
        <button
          className={`wr-vocab-tab ${mode === "flashcard" ? "active" : ""}`}
          onClick={() => {
            setMode("flashcard");
            setFlipped(false);
          }}
        >
          🃏 Flashcards
        </button>
        <button
          className={`wr-vocab-tab ${mode === "match" ? "active" : ""}`}
          onClick={() => setMode("match")}
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

      {/* ── Match mode (simplified for report view) ── */}
      {mode === "match" && (
        <div style={{ padding: "32px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            View vocabulary in flashcard mode for review
          </p>
        </div>
      )}
    </div>
  );
}

// ─── TaskPanel ────────────────────────────────────────────────────────────────

function TaskPanel({ feedback }: { feedback: TaskFeedback }) {
  const [activeTab, setActiveTab] = useState<
    "scores" | "sentences" | "vocabulary" | "grammar"
  >("scores");

  return (
    <div className="wr-task-panel">
      <div className="wr-tabs">
        <button
          className={`wr-tab ${activeTab === "scores" ? "active" : ""}`}
          onClick={() => setActiveTab("scores")}
        >
          📊 Band Scores
        </button>
        <button
          className={`wr-tab ${activeTab === "sentences" ? "active" : ""}`}
          onClick={() => setActiveTab("sentences")}
        >
          🔍 Sentences
        </button>
        <button
          className={`wr-tab ${activeTab === "vocabulary" ? "active" : ""}`}
          onClick={() => setActiveTab("vocabulary")}
        >
          📚 Vocabulary
        </button>
        <button
          className={`wr-tab ${activeTab === "grammar" ? "active" : ""}`}
          onClick={() => setActiveTab("grammar")}
        >
          🧠 Grammar
        </button>
      </div>

      {activeTab === "scores" && (
        <div className="wr-tab-content">
          <div className="wr-band-grid">
            <BandCircle
              score={feedback.bandScores.taskAchievement}
              label="Task Achievement"
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
              label="Grammatical Range"
            />
            <BandCircle
              score={feedback.bandScores.overall}
              label="OVERALL BAND"
            />
          </div>

          <div className="wr-comment-section">
            <h3 className="wr-comment-title">📝 Examiner's Comment</h3>
            <p className="wr-comment-text">{feedback.generalComment}</p>
          </div>
        </div>
      )}

      {activeTab === "sentences" && (
        <div className="wr-tab-content">
          <div className="wr-sentences-list">
            {feedback.sentences.map((sent, i) => (
              <SentenceCard key={i} item={sent} index={i} />
            ))}
          </div>
        </div>
      )}

      {activeTab === "vocabulary" && (
        <div className="wr-tab-content">
          <VocabSection words={feedback.vocabulary} />
        </div>
      )}

      {activeTab === "grammar" && (
        <div className="wr-tab-content">
          <div className="wr-grammar-list">
            {feedback.grammarStructures.map((struct, i) => (
              <GrammarCard key={i} item={struct} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ReportView Component ────────────────────────────────────────────────

export default function ReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<TaskFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Please sign in to view reports");
        setLoading(false);
        return;
      }

      if (!reportId) {
        setError("Report not found");
        setLoading(false);
        return;
      }

      try {
        const reportRef = doc(db, "users", user.uid, "reports", reportId);
        const snap = await getDoc(reportRef);

        if (!snap.exists()) {
          setError("Report not found");
          setLoading(false);
          return;
        }

        const data = snap.data();
        setFeedback(data.feedback as TaskFeedback);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [reportId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid #e2e8f0",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <p style={{ color: "#64748b" }}>Loading report...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "12px" }}>
            {error || "Report not found"}
          </h2>
          <button
            onClick={() => navigate("/user-account")}
            style={{
              background: "#6366f1",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0f172a",
          padding: "20px 32px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => navigate("/user-account")}
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back
        </button>
        <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>
          Task {feedback.taskNumber} Feedback
        </h1>
        <div style={{ width: "120px" }} />
      </div>

      {/* Main Content */}
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}
      >
        <TaskPanel feedback={feedback} />
      </div>
    </div>
  );
}
