import { useState, useEffect } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../firebase/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserData {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: unknown;
  subscription: string | null;
  usage?: { monthKey: string; count: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isPro(subscription: string | null): boolean {
  if (!subscription) return false;
  if (subscription === "forever") return true;
  return new Date(subscription) > new Date();
}

function daysLeft(subscription: string | null): number {
  if (!subscription || subscription === "forever") return 0;
  const diff = new Date(subscription).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        border: `2px solid ${dark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.4)"}`,
        borderTopColor: dark ? "#6366f1" : "white",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ─── Input Component ──────────────────────────────────────────────────────────
function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rightEl,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rightEl?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "11px 14px",
            paddingRight: rightEl ? "42px" : "14px",
            border: "1px solid #e2e8f0",
            borderRadius: "9px",
            fontSize: "14px",
            color: "#1e293b",
            outline: "none",
            boxSizing: "border-box",
            background: "white",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
        {rightEl && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          >
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const saveUserToFirestore = async (user: User, displayName?: string) => {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        name: displayName || user.displayName || "User",
        email: user.email || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        subscription: null,
      });
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await saveUserToFirestore(result.user);
    } catch (e: any) {
      if (e.code === "auth/popup-closed-by-user") {
        setError("Popup was closed. Please try again.");
      } else if (e.code === "auth/popup-blocked") {
        setError("Popup was blocked by browser. Please allow popups.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (tab === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "signup") {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(result.user, { displayName: name });
        await saveUserToFirestore(result.user, name);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      const msgs: Record<string, string> = {
        "auth/email-already-in-use":
          "This email is already registered. Try signing in.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      setError(msgs[e.code] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#6366f1",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{ color: "white", fontWeight: "800", fontSize: "18px" }}
            >
              W
            </span>
          </div>
          <span
            style={{ fontWeight: "700", fontSize: "18px", color: "#0f172a" }}
          >
            WritingReady
          </span>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            background: "#f1f5f9",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "24px",
          }}
        >
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
              }}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "#0f172a" : "#64748b",
                fontWeight: tab === t ? "700" : "500",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <h2
          style={{
            fontSize: "21px",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 20px 0",
          }}
        >
          {tab === "signin" ? "Welcome back 👋" : "Create your account"}
        </h2>

        {/* Form */}
        {tab === "signup" && (
          <Input
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Selena Gomez"
          />
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="selena@example.com"
        />
        <Input
          label="Password"
          type={showPass ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="Min. 6 characters"
          rightEl={
            <span onClick={() => setShowPass(!showPass)}>
              <EyeIcon show={showPass} />
            </span>
          }
        />

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Email Button */}
        <button
          onClick={handleEmailAuth}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#a5b4fc" : "#6366f1",
            color: "white",
            fontWeight: "700",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {loading ? <Spinner /> : null}
          {loading
            ? "Please wait..."
            : tab === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span
            style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}
          >
            or
          </span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "12px",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            background: "white",
            color: "#1e293b",
            fontWeight: "600",
            fontSize: "14px",
            cursor: googleLoading ? "not-allowed" : "pointer",
          }}
        >
          {googleLoading ? <Spinner dark /> : <GoogleIcon />}
          Continue with Google
        </button>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "20px",
            lineHeight: "1.6",
          }}
        >
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user }: { user: User }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const MONTHLY_LIMIT = 12; // api/feedback.ts'dagi MONTHLY_LIMIT bilan bir xil bo'lishi kerak

  function currentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function monthlyUsed(usage?: { monthKey: string; count: number }): number {
    if (!usage) return 0;
    return usage.monthKey === currentMonthKey() ? usage.count : 0;
  }

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data() as UserData);
      setLoading(false);
    };
    load();
  }, [user.uid]);

  if (loading)
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
        <Spinner dark />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  const subscription = userData?.subscription ?? null;
  const pro = isPro(subscription);
  const days = daysLeft(subscription);
  const isLifetime = subscription === "forever";
  const used = monthlyUsed(userData?.usage);
  const remaining = Math.max(0, MONTHLY_LIMIT - used);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0f172a",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#6366f1",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{ color: "white", fontWeight: "800", fontSize: "16px" }}
            >
              W
            </span>
          </div>
          <span style={{ color: "white", fontWeight: "700", fontSize: "17px" }}>
            WritingReady
          </span>
        </div>
        <button
          onClick={() => signOut(auth)}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #334155",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>

      <div
        style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Profile Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "28px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: "700",
                color: "white",
              }}
            >
              {(userData?.name || user.email || "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <h2
              style={{
                margin: "0 0 4px 0",
                fontSize: "20px",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              {userData?.name || user.displayName || "User"}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
              {userData?.email || user.email}
            </p>
          </div>
        </div>

        {/* Subscription Card */}
        <div
          style={{
            background: pro
              ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)"
              : "white",
            borderRadius: "16px",
            padding: "28px",
            border: pro ? "none" : "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              background: pro ? "#6366f1" : "#f1f5f9",
              color: pro ? "white" : "#64748b",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {pro ? "⚡ PRO" : "FREE"}
          </span>
          <h3
            style={{
              margin: "12px 0 4px 0",
              fontSize: "22px",
              fontWeight: "700",
              color: pro ? "white" : "#0f172a",
            }}
          >
            {pro ? "You're on Pro!" : "Free Plan"}
          </h3>

          {/* Subscription time remaining */}
          {pro && (
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              {isLifetime
                ? "Lifetime access — never expires"
                : days > 0
                  ? `${days} ${days === 1 ? "day" : "days"} left · renews ${formatDate(subscription!)}`
                  : "Your subscription has expired"}
            </p>
          )}

          <p
            style={{
              margin: "0 0 20px 0",
              fontSize: "14px",
              color: pro ? "#94a3b8" : "#64748b",
            }}
          >
            {pro && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Bu oy ishlatilgan
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    {used}/{MONTHLY_LIMIT}
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    height: "6px",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (used / MONTHLY_LIMIT) * 100)}%`,
                      height: "100%",
                      background: remaining === 0 ? "#ef4444" : "#6366f1",
                      borderRadius: "3px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                {remaining === 0 && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#f87171",
                      margin: "6px 0 0 0",
                    }}
                  >
                    Bu oylik limit tugadi. Keyingi oyda qaytadan yangilanadi.
                  </p>
                )}
              </div>
            )}
          </p>

          {[
            { label: "Real exam-style prompts", free: true },
            { label: "Sentence-by-sentence feedback", free: false },
            { label: "Estimated band score per sentence", free: false },
            { label: "Full essay report (4 criteria)", free: false },
            { label: "15 topic-specific vocabulary words", free: false },
            { label: "High-level sample essays", free: false },
          ].map((f) => {
            const available = f.free || pro;
            return (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: available
                      ? pro
                        ? "rgba(99,102,241,0.3)"
                        : "#ecfdf5"
                      : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    color: available
                      ? pro
                        ? "#a5b4fc"
                        : "#10b981"
                      : "#94a3b8",
                  }}
                >
                  {available ? "✓" : "✕"}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: available ? "500" : "400",
                    color: available ? (pro ? "white" : "#1e293b") : "#94a3b8",
                  }}
                >
                  {f.label}
                </span>
              </div>
            );
          })}

          {!pro && (
            <button
              style={{
                width: "100%",
                background: "#6366f1",
                color: "white",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              Upgrade to Pro — 25,000 UZS/month
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking)
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
            width: "32px",
            height: "32px",
            border: "3px solid #e2e8f0",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  if (!user) return <AuthScreen />;
  return <Dashboard user={user} />;
}