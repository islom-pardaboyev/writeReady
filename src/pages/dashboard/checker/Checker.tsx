import { useState, useRef } from "react";

interface LTMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: { issueType: string; category: { name: string } };
}

interface Popover {
  match: LTMatch;
  x: number;
  y: number;
}

async function checkText(text: string, language: string): Promise<LTMatch[]> {
  const params = new URLSearchParams({
    text,
    language,
    disabledRules: "WHITESPACE_RULE",
  });
  const res = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("LanguageTool API error");
  const data = await res.json();
  return data.matches as LTMatch[];
}

function issueColor(issueType: string): string {
  if (issueType === "misspelling") return "#ef4444";
  if (issueType === "grammar") return "#f59e0b";
  return "#3b82f6";
}

function buildSegments(text: string, matches: LTMatch[]) {
  const sorted = [...matches].sort((a, b) => a.offset - b.offset);
  const segments: { text: string; match?: LTMatch }[] = [];
  let cursor = 0;
  for (const m of sorted) {
    if (m.offset > cursor) {
      segments.push({ text: text.slice(cursor, m.offset) });
    }
    segments.push({ text: text.slice(m.offset, m.offset + m.length), match: m });
    cursor = m.offset + m.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

function Checker() {
  const [input, setInput] = useState("");
  const [matches, setMatches] = useState<LTMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en-US" | "en-GB">("en-GB");
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [popover, setPopover] = useState<Popover | null>(null);
  const [correctedText, setCorrectedText] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleCheck = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setPopover(null);
    try {
      const result = await checkText(input, language);
      setMatches(result);
      setCorrectedText(input);
      setChecked(true);
    } catch {
      setError("Could not reach LanguageTool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyReplacement = (match: LTMatch, replacement: string) => {
    setCorrectedText((prev) =>
      prev.slice(0, match.offset) + replacement + prev.slice(match.offset + match.length),
    );
    setMatches((prev) => prev.filter((m) => m !== match));
    setPopover(null);
  };

  const segments = checked ? buildSegments(correctedText, matches) : [];

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="chk-root">
        <div className="chk-hero">
          <span className="chk-eyebrow">Writing Checker</span>
          <h1 className="chk-title">Find & Fix Your Mistakes</h1>
          <p className="chk-subtitle">
            Paste your IELTS essay below. We'll highlight grammar, spelling, and style issues instantly.
          </p>
        </div>

        <div className="chk-card">
          {!checked ? (
            <>
              <div className="chk-toolbar">
                 <div className="chk-lang-toggle">
                  <button
                    className={`chk-lang-btn ${language === "en-GB" ? "active" : ""}`}
                    onClick={() => setLanguage("en-GB")}
                  >🇬🇧 British</button>
                  <button
                    className={`chk-lang-btn ${language === "en-US" ? "active" : ""}`}
                    onClick={() => setLanguage("en-US")}
                  >🇺🇸 American</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="chk-word-count">{wordCount} words</span>
                  <button
                    className="chk-btn"
                    onClick={handleCheck}
                    disabled={loading || !input.trim()}
                  >
                    {loading ? "Checking…" : "Check Writing"}
                  </button>
                </div>
              </div>
              <textarea
                className="chk-textarea"
                placeholder="Paste or type your essay here…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={16}
              />
            </>
          ) : (
            <>
              <div className="chk-toolbar">
                <div className="chk-stats">
                  <span className={`chk-stat ${matches.length === 0 ? "green" : "red"}`}>
                    {matches.length === 0
                      ? "✓ No issues found"
                      : `${matches.length} issue${matches.length !== 1 ? "s" : ""} found`}
                  </span>
                </div>
                <button
                  className="chk-btn chk-btn--ghost"
                  onClick={() => {
                    setChecked(false);
                    setMatches([]);
                    setPopover(null);
                    setInput(correctedText);
                  }}
                >
                  Edit Text
                </button>
              </div>

              <div
                className="chk-highlighted"
                ref={overlayRef}
                onClick={() => setPopover(null)}
              >
                {segments.map((seg, i) =>
                  seg.match ? (
                    <mark
                      key={i}
                      className="chk-mark"
                      style={{
                        borderBottomColor: issueColor(seg.match.rule.issueType),
                        textDecorationColor: issueColor(seg.match.rule.issueType),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        const containerRect = overlayRef.current!.getBoundingClientRect();
                        setPopover({
                          match: seg.match!,
                          x: rect.left - containerRect.left,
                          y: rect.bottom - containerRect.top + 6,
                        });
                      }}
                    >
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}

                {popover && (
                  <div
                    className="chk-popover"
                    style={{ left: popover.x, top: popover.y }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="chk-pop-msg">{popover.match.message}</p>
                    {popover.match.replacements.length > 0 && (
                      <div className="chk-pop-suggestions">
                        <span className="chk-pop-label">Suggestions:</span>
                        <div className="chk-pop-chips">
                          {popover.match.replacements.slice(0, 5).map((r, i) => (
                            <button
                              key={i}
                              className="chk-chip"
                              onClick={() => applyReplacement(popover.match, r.value)}
                            >
                              {r.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <span className="chk-pop-category">
                      {popover.match.rule.category.name}
                    </span>
                  </div>
                )}
              </div>

              {matches.length === 0 && (
                <div className="chk-all-clear">
                  <span>🎉</span>
                  <p>All issues resolved! Your text looks great.</p>
                </div>
              )}
            </>
          )}

          {error && <p className="chk-error">{error}</p>}
        </div>

        {checked && matches.length > 0 && (
          <div className="chk-issues-list">
            <h2 className="chk-issues-title">All Issues</h2>
            {matches.map((m, i) => (
              <div key={i} className="chk-issue-row">
                <span
                  className="chk-issue-dot"
                  style={{ background: issueColor(m.rule.issueType) }}
                />
                <div className="chk-issue-body">
                  <span className="chk-issue-word">
                    "{correctedText.slice(m.offset, m.offset + m.length)}"
                  </span>
                  <span className="chk-issue-msg">{m.message}</span>
                </div>
                {m.replacements.length > 0 && (
                  <button
                    className="chk-chip"
                    onClick={() => applyReplacement(m, m.replacements[0].value)}
                  >
                    {m.replacements[0].value}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
  .chk-root {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 50%, #eff6ff 100%);
    padding: 48px 16px 80px;
    font-family: 'Inter', sans-serif;
  }
  .chk-hero {
    max-width: 680px; margin: 0 auto 32px; text-align: center;
  }
  .chk-eyebrow {
    display: inline-block;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.25em; color: #2563eb;
    background: #eff6ff; border: 1px solid #bfdbfe;
    padding: 4px 12px; border-radius: 999px; margin-bottom: 14px;
  }
  .chk-title {
    font-size: clamp(26px, 5vw, 38px); font-weight: 800;
    color: #0f172a; line-height: 1.2; margin-bottom: 12px;
  }
  .chk-subtitle {
    font-size: 15px; color: #64748b; line-height: 1.6;
  }
  .chk-card {
    max-width: 860px; margin: 0 auto;
    background: #fff; border: 1px solid #dbeafe;
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 18px 40px rgba(148,163,184,0.12);
  }
  .chk-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .chk-word-count { font-size: 12px; color: #94a3b8; font-family: monospace; }
  .chk-stats { display: flex; gap: 10px; align-items: center; }
  .chk-stat {
    font-size: 13px; font-weight: 600;
  }
  .chk-stat.green { color: #16a34a; }
  .chk-stat.red   { color: #dc2626; }
  .chk-btn {
    padding: 9px 20px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    border: none; cursor: pointer;
    background: #2563eb; color: #fff;
    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
    transition: background 0.15s, transform 0.15s;
  }
  .chk-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
  .chk-btn:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
  .chk-btn--ghost {
    background: transparent; color: #475569;
    border: 1px solid #cbd5e1; box-shadow: none;
  }
  .chk-btn--ghost:hover { background: #f1f5f9; transform: none; }
  .chk-textarea {
    width: 100%; padding: 20px;
    border: none; outline: none; resize: vertical;
    font-size: 15px; line-height: 1.8; color: #1e293b;
    font-family: inherit; background: transparent;
    min-height: 320px;
  }
  .chk-highlighted {
    position: relative;
    padding: 20px; font-size: 15px; line-height: 1.8;
    color: #1e293b; white-space: pre-wrap; word-break: break-word;
    min-height: 320px;
    cursor: default;
  }
  .chk-mark {
    background: transparent;
    border-bottom: 2px solid;
    cursor: pointer;
    border-radius: 1px;
    transition: background 0.1s;
  }
  .chk-mark:hover { background: rgba(239,68,68,0.08); }
  .chk-popover {
    position: absolute; z-index: 100;
    background: #0f172a; border: 1px solid #1e3a5f;
    border-radius: 12px; padding: 14px 16px;
    max-width: 300px; min-width: 200px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.35);
  }
  .chk-pop-msg {
    font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;
  }
  .chk-pop-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #475569; display: block; margin-bottom: 6px;
  }
  .chk-pop-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chk-pop-category {
    display: block; margin-top: 10px;
    font-size: 10px; color: #475569;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .chk-chip {
    padding: 5px 11px; border-radius: 6px;
    background: #1d4ed8; color: #fff;
    font-size: 12px; font-weight: 600;
    border: none; cursor: pointer;
    transition: background 0.12s;
  }
  .chk-chip:hover { background: #2563eb; }
  .chk-all-clear {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 24px;
    font-size: 15px; color: #16a34a; font-weight: 500;
  }
  .chk-error {
    padding: 14px 20px; color: #dc2626; font-size: 13px;
    border-top: 1px solid #fecaca; background: #fff5f5;
  }
  .chk-issues-list {
    max-width: 860px; margin: 24px auto 0;
    display: flex; flex-direction: column; gap: 8px;
  }
  .chk-issues-title {
    font-size: 13px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-bottom: 4px;
  }
  .chk-issue-row {
    display: flex; align-items: center; gap: 12px;
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 10px; padding: 12px 16px;
  }
  .chk-issue-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .chk-issue-body { flex: 1; min-width: 0; }
  .chk-issue-word {
    display: block; font-size: 13px; font-weight: 600;
    color: #0f172a; margin-bottom: 2px;
  }
  .chk-issue-msg { font-size: 12px; color: #64748b; }
`;

export default Checker;
