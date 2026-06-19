import { useState } from "react";
import { CreditCard, Copy, Check, Send, X } from "lucide-react";

const CARD_NUMBER = "9860 1606 4046 4600";
const CARD_HOLDER = "PI";
const TELEGRAM_HANDLE = "@writeready_admin";
const TELEGRAM_LINK = "https://t.me/writeready_admin";

interface PaymentModalProps {
  onClose: () => void;
}

function PaymentModal({ onClose }: PaymentModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard not available — the number is still visible to copy by hand.
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 sm:px-7">
          <div>
            <h2 id="payment-modal-title" className="text-xl font-black text-gray-900">
              Complete payment
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pro · 25,000 UZS/month
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-t border-gray-100" />

        <div className="space-y-6 px-6 py-6 sm:px-7">
          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                1
              </span>
              <h3 className="font-bold text-gray-900">Transfer to this card</h3>
            </div>

            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <CreditCard size={15} />
                Card number
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-mono! text-lg font-bold tracking-wide text-gray-900">
                  {CARD_NUMBER}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Cardholder: <span className="font-semibold text-gray-700">{CARD_HOLDER}</span>
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                2
              </span>
              <h3 className="font-bold text-gray-900">Send the payment receipt</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Send a screenshot of the transfer on Telegram to{" "}
              <span className="font-semibold text-gray-900">{TELEGRAM_HANDLE}</span>. Your
              Pro access will be activated within 24 hours.
            </p>

            <a
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Send size={16} />
              Open Telegram — {TELEGRAM_HANDLE}
            </a>
          </div>

          <p className="text-center text-xs text-gray-400">
            More payment options will be added soon.
          </p>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 text-gray-900 sm:px-6 lg:px-8">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">
          Pricing
        </p>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Choose the plan that fits your IELTS goal
        </h1>
        <p className="text-gray-600">
          Start free, then upgrade when you want deeper feedback and scoring.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Free plan */}
        <article className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Free
          </p>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-4xl font-black text-gray-900">0 UZS</span>
            <span className="pb-1 text-gray-500">/forever</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            <li>✅ Unlimited IELTS writing practice</li>
            <li>✅ Real exam-style Task 1 & Task 2 prompts</li>
            <li>✅ Fresh topics updated weekly</li>
            <li>✅ Built-in timer & word counter</li>
            <li className="text-gray-400">❌ No feedback</li>
            <li className="text-gray-400">❌ No scoring</li>
          </ul>
          <button className="mt-8 rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Start for free
          </button>
        </article>

        {/* Pro plan */}
        <article className="flex flex-col rounded-3xl border border-blue-200 bg-linear-to-b from-blue-50 to-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">
              Pro
            </p>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </span>
          </div>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-4xl font-black text-gray-900">25,000 UZS</span>
            <span className="pb-1 text-gray-500">/month</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            <li>✅ Everything in Free</li>
            <li>
              ✅ <strong>Sentence-by-sentence feedback</strong> — every sentence
              analyzed individually
            </li>
            <li>
              ✅ <strong>Estimated band score</strong> per sentence
            </li>
            <li>
              ✅ <strong>Full essay report</strong> — Task Achievement,
              Coherence, Lexical Resource, Grammar scored 1–9
            </li>
            <li>
              ✅ <strong>15 topic-specific vocabulary words</strong> — curated
              for your exact essay topic
            </li>
            <li>✅ <strong>High-level sample essays</strong> models</li>
          </ul>
          <button
            onClick={() => setShowPayment(true)}
            className="mt-8 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Upgrade to Pro
          </button>
        </article>
      </div>

      <p className="text-center text-sm font-medium text-amber-700">
        Most popular among Band 6→7+ learners 🔥
      </p>

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </section>
  );
}

export default Pricing;