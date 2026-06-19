import { useState, useRef } from "react";

type Item = {
  number: number;
  template: string;
  answer: string;
};

type Group = {
  heading?: string;
  headingInfo?: string;
  items: Item[];
};

type Data = {
  title: string;
  instructions: string;
  groups: Group[];
  audio?: string;
};

type ItemState = {
  value: string;
  status: "idle" | "correct" | "wrong";
};

function splitTemplate(template: string): [string, string] {
  const [prefix, suffix] = template.split("___");
  return [prefix ?? "", suffix ?? ""];
}

function isCorrect(userInput: string, answer: string): boolean {
  const normalized = userInput.trim().toLowerCase();
  if (!normalized) return false;
  return answer
    .split("/")
    .map((a) => a.trim().toLowerCase())
    .includes(normalized);
}

const statusStyle: Record<ItemState["status"], string> = {
  idle:    "border-gray-300 focus:border-gray-700",
  correct: "border-green-500 bg-green-50 text-green-700",
  wrong:   "border-red-400 bg-red-50 text-red-600",
};

function HighlightableText({ text }: { text: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) return;

    const range = selection.getRangeAt(0);
    
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const mark = document.createElement("mark");
    mark.className = "bg-yellow-200 text-gray-900 rounded-sm px-0.5 cursor-pointer transition-colors hover:bg-yellow-300";
    mark.title = "Click to remove highlight";
    
    mark.onclick = (e) => {
      e.stopPropagation();
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize(); }
    };

    try {
      range.surroundContents(mark);
    } catch (err) {
      console.warn("Could not wrap complex text selection", err);
    }

    selection.removeAllRanges();
  };

  return (
    <span 
      ref={containerRef} 
      onMouseUp={handleSelection}
      className="selection:bg-yellow-200/50"
    >
      {text}
    </span>
  );
}

export default function NotesCompletion({ data }: { data: Data }) {
  const allItems = data.groups.flatMap((g) => g.items);

  const [states, setStates] = useState<Record<number, ItemState>>(() =>
    Object.fromEntries(allItems.map((i) => [i.number, { value: "", status: "idle" }]))
  );

  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (num: number, value: string) => {
    setStates((prev) => ({
      ...prev,
      [num]: { value, status: "idle" },
    }));
  };

  const handleCheck = () => {
    setStates((prev) => {
      const next = { ...prev };
      allItems.forEach((item) => {
        next[item.number] = {
          ...prev[item.number],
          status: isCorrect(prev[item.number].value, item.answer) ? "correct" : "wrong",
        };
      });
      return next;
    });
    setShowPopup(true);
  };

  const handleReset = () => {
    setStates(
      Object.fromEntries(allItems.map((i) => [i.number, { value: "", status: "idle" }]))
    );
    setShowPopup(false);

    document.querySelectorAll("mark").forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      }
    });
  };

  const checkedItems = allItems.filter((i) => states[i.number].status !== "idle");
  const correctCount = allItems.filter((i) => states[i.number].status === "correct").length;
  const total = allItems.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const missedItems = allItems.filter((i) => states[i.number].status === "wrong");

  const scoreRingColor =
    score >= 80 ? "bg-green-100 text-green-700" :
    score >= 50 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700";

  const scoreLabel =
    score === 100 ? "Perfect score! 🎉" :
    score >= 80   ? "Great job! 🙌" :
    score >= 50   ? "Good effort! 👍" :
                    "Keep practising! 📚";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 font-sans select-text">
      {data.audio && (
        <audio controls className="mb-6">
          <source src={data.audio} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      {/* Header */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">{data.title}</h1>
      <div className="text-sm text-gray-500 bg-gray-50 border-l-2 border-gray-300 px-3 py-2 rounded mb-8 flex justify-between items-center">
        <div>
          Instructions: <span className="font-medium text-gray-700">{data.instructions}</span>
        </div>
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 shrink-0 hidden md:inline-block">
          💡 Select any text to highlight it. Click highlight to erase.
        </span>
      </div>

      {/* Groups */}
      {data.groups.map((group, gi) => (
        <div key={gi} className="mb-8">
          {group.heading && (
            <h2 className="text-base font-semibold text-gray-800 pb-2 mb-4 border-b border-gray-200">
              <HighlightableText text={group.heading} />
            </h2>
          )}
          {group.headingInfo && (
            <p className="text-sm text-gray-500 mb-4">
              <HighlightableText text={group.headingInfo} />
            </p>
          )}

          <div className="space-y-5">
            {group.items.map((item) => {
              const [prefix, suffix] = splitTemplate(item.template);
              const st = states[item.number];

              return (
                <div key={item.number} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-gray-800 leading-relaxed">
                  {/* Question number */}
                  <span className="text-xs font-semibold text-gray-400 w-5 shrink-0 select-none">{item.number}</span>

                  {/* Prefix */}
                  {prefix && <HighlightableText text={prefix.trimEnd() + " "} />}

                  {/* Input */}
                  <input
                    type="text"
                    value={st.value}
                    onChange={(e) => handleChange(item.number, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                    className={`
                      w-32 border-b-2 bg-transparent outline-none
                      px-1 py-0.5 text-center text-[15px]
                      transition-colors duration-150
                      ${statusStyle[st.status]}
                    `}
                  />

                  {/* Suffix */}
                  {suffix && <HighlightableText text={" " + suffix.trimStart()} />}

                  {/* Inline feedback icon */}
                  {st.status === "correct" && (
                    <span className="text-green-500 text-sm select-none">✓</span>
                  )}
                  {st.status === "wrong" && (
                    <span className="text-red-400 text-sm select-none" title={`Answer: ${item.answer}`}>✗</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleCheck}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Check answers
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Results Popup */}
      {showPopup && checkedItems.length > 0 && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Score ring */}
            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-2xl font-semibold ${scoreRingColor}`}>
              {score}%
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">{scoreLabel}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {correctCount} out of {total} correct
            </p>

            {/* Missed answers table */}
            {missedItems.length > 0 && (
              <div className="text-left mb-6 border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  Missed answers
                </div>
                {missedItems.map((item) => {
                  const [prefix] = splitTemplate(item.template);
                  return (
                    <div
                      key={item.number}
                      className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-400 font-medium">Q{item.number}</span>
                      <span className="text-gray-600 text-xs truncate mx-3 flex-1">
                        {prefix.trim().slice(0, 30)}…
                      </span>
                      <span className="text-green-600 font-semibold">{item.answer}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Review answers
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}