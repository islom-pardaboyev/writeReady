function Footer() {
  return (
   <footer className="max-w-6xl px-4 py-14 mx-auto sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-14"
          style={{
            background:
              "linear-gradient(135deg, #0d0b26 0%, #181540 50%, #0d0b26 100%)",
          }}
        >
          {/* Background glow orbs */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full"
            style={{
              background: "rgba(99,102,241,0.14)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full"
            style={{
              background: "rgba(139,92,246,0.10)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.9fr] items-center">
            {/* Left: Heading + description */}
            <div>
              <p
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.32em]"
                style={{ color: "#fbbf24" }}
              >
                <span
                  className="inline-block h-px w-6 flex-shrink-0"
                  style={{ background: "#fbbf24" }}
                />
                Connect professionally
              </p>
              <h2
                className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl"
                style={{ color: "#fff" }}
              >
                Information &amp;{" "}
                <span style={{ color: "#a5b4fc" }}>Inquiries</span>
              </h2>
              <p
                className="mt-4 text-base leading-relaxed max-w-lg"
                style={{ color: "rgba(203,213,225,0.82)" }}
              >
                Questions, feedback, or just want to say hello? I'm always eager
                to connect with fellow IELTS learners and educators — whether
                for support, collaboration, or to help make WriteReady even
                better.
              </p>
            </div>

            {/* Right: Contact cards */}
            <div className="flex flex-col gap-3">
              <a
                href="mailto:ipardaboyev574@gmail.com"
                className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(59,130,246,0.10)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(96,165,250,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.10)";
                }}
              >
                <span
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-200 group-hover:bg-blue-500/30"
                  style={{
                    background: "rgba(59,130,246,0.20)",
                    border: "1px solid rgba(59,130,246,0.30)",
                  }}
                >
                  📧
                </span>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#fff" }}
                  >
                    Email
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(148,163,184,0.90)" }}
                  >
                    ipardaboyev574@gmail.com
                  </p>
                </div>
                <span
                  className="ml-auto text-base transition-all duration-200 group-hover:translate-x-1"
                  style={{ color: "rgba(148,163,184,0.40)" }}
                >
                  →
                </span>
              </a>

              <a
                href="https://islomdev.uz"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(139,92,246,0.10)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(167,139,250,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.10)";
                }}
              >
                <span
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-200 group-hover:bg-purple-500/30"
                  style={{
                    background: "rgba(139,92,246,0.20)",
                    border: "1px solid rgba(139,92,246,0.30)",
                  }}
                >
                  🌐
                </span>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#fff" }}
                  >
                    Portfolio
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(148,163,184,0.90)" }}
                  >
                    islomdev.uz
                  </p>
                </div>
                <span
                  className="ml-auto text-base transition-all duration-200 group-hover:translate-x-1"
                  style={{ color: "rgba(148,163,184,0.40)" }}
                >
                  →
                </span>
              </a>

              <p
                className="text-center text-xs mt-1"
                style={{ color: "rgba(148,163,184,0.45)" }}
              >
                Usually responds within 24 hours
              </p>
            </div>
          </div>
        </div>
      </footer>
  )
}

export default Footer
