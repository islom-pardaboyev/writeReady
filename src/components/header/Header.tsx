import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PenLine, UserRound, Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/writing", label: "Writing" },
  { to: "/listening", label: "Listening", soon: true },
  { to: "/reading", label: "Reading", soon: true },
];

function SoonBadge() {
  return (
    <Badge
      variant="secondary"
      className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0 text-[10px] font-semibold text-amber-700 hover:bg-amber-50"
    >
      Soon
    </Badge>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3.5 lg:gap-8">
          {/* Logo & Branding */}
          <a
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <PenLine size={18} strokeWidth={2.25} />
            </span>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-lg font-black leading-tight tracking-tight text-gray-900 sm:text-xl">
                  WriteReady
                </p>
                <p className="text-[11px] font-medium leading-tight text-gray-500 sm:text-xs">
                  IELTS Writing, AI-scored
                </p>
              </div>
              <span className="hidden items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-700 sm:inline-flex">
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600"
                  aria-hidden="true"
                />
                Live
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )
                }
              >
                <span className="flex items-center gap-2">
                  {link.label}
                  {link.soon ? <SoonBadge /> : null}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* Right-side actions — one clear hierarchy: link, icon, primary button */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )
              }
            >
              Pricing
            </NavLink>
            <NavLink
              to="/user-account"
              aria-label="Account"
              className={({ isActive }) =>
                cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                  isActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
                )
              }
            >
              <UserRound size={18} />
            </NavLink>
            <NavLink to="/writing/mock">
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl">
                Get Started
                <span aria-hidden="true">→</span>
              </button>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open menu</span>
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu — now includes every link the desktop version has */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 bg-white pb-4 pt-2 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )
                  }
                >
                  <span className="flex items-center gap-2">
                    {link.label}
                    {link.soon ? <SoonBadge /> : null}
                  </span>
                </NavLink>
              ))}

              <div className="my-1 border-t border-gray-100" />

              <NavLink
                to="/pricing"
                onClick={closeMenu}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )
                }
              >
                Pricing
              </NavLink>
              <NavLink
                to="/user-account"
                onClick={closeMenu}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )
                }
              >
                <UserRound size={16} />
                Account
              </NavLink>
            </nav>

            <div className="mt-3 px-1">
              <NavLink to="/writing/mock" onClick={closeMenu}>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700">
                  Get Started
                  <span aria-hidden="true">→</span>
                </button>
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;