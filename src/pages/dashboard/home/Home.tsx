import { NavLink } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer/Footer";
import MobileAlert from "@/components/mobileAlert/MobileAlert";

const features = [
  {
    icon: "📝",
    title: "Mock Test",
    description:
      "Simulate real IELTS exam conditions with timed Task 1 and Task 2 questions.",
    path: "writing/mock",
  },
  {
    icon: "🎯",
    title: "Focused Practice",
    description:
      "Choose exam-style prompts and polish your responses with clarity and speed.",
    path: "writing/practice",
  },
  {
    icon: "🛋️",
    title: "Relax Mode",
    description:
      "Free writing mode for planning, reviewing, and building confidence without pressure.",
    path: "writing/relax",
  },
];

const stats = [
  { value: "120+", label: "Exam Prompts" },
  { value: "2", label: "Task Types" },
  { value: "24/7", label: "Anytime Access" },
];

function Home() {
  const pageRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const homeSections = pageRef.current?.querySelectorAll(".home-section");

    if (homeSections) {
      gsap.from(homeSections, {
        y: 28,
        opacity: 0,
        stagger: 0.16,
        duration: 3,
        ease: "power3.out",
      });
    }
  }, []);

  return (
    <main ref={pageRef} className="min-h-screen from-white to-gray-50">
      <MobileAlert />
      {/* Hero Section */}
      <section className="home-section relative px-4 py-12 overflow-hidden sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Background decoration */}
          <div className="absolute bg-blue-100 rounded-full -right-20 -top-20 h-80 w-80 opacity-20 blur-3xl"></div>
          <div className="absolute bg-purple-100 rounded-full -left-20 -bottom-20 h-80 w-80 opacity-20 blur-3xl"></div>

          <div className="relative z-10 space-y-8">
            <div className="max-w-3xl space-y-3 home-hero-item">
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 text-xs uppercase tracking-[0.25em] hover:bg-blue-50">
                🚀 IELTS Writing Practice
              </Badge>
            </div>

            <div className="max-w-3xl space-y-3 home-hero-item">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Master IELTS <span className="text-blue-600">Writing</span> with
                Real Exam Conditions
              </h1>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg home-hero-item">
              Practice under exam pressure, get instant feedback, and build the
              speed and structure you need to score higher. Choose your mode and
              start writing today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row home-hero-item">
              <NavLink to="/writing/mock" className="group">
                <Button
                  size="lg"
                  className="w-full px-8 py-3 text-base font-semibold text-white transition-all bg-blue-600 shadow-lg sm:w-auto hover:bg-blue-700 hover:shadow-xl"
                >
                  🎯 Start Mock Test
                </Button>
              </NavLink>
              <NavLink to="/writing/practice" className="group">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full px-8 py-3 text-base font-semibold text-gray-700 transition-all border-2 border-gray-300 sm:w-auto hover:border-blue-600 hover:bg-blue-50"
                >
                  ✏️ Practice Now
                </Button>
              </NavLink>
              <NavLink to="/writing/relax" className="group">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full px-8 py-3 text-base font-semibold text-gray-700 transition-all border-2 border-gray-300 sm:w-auto hover:border-purple-600 hover:bg-purple-50"
                >
                  🛋️ Relax Mode
                </Button>
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="home-section max-w-6xl px-4 py-10 mx-auto sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 border border-blue-200 rounded-2xl bg-blue-50">
            <h3 className="mb-3 font-semibold text-blue-900">
              📋 Task 1 (20 min)
            </h3>
            <p className="text-sm leading-relaxed text-blue-800">
              Describe charts, processes, or maps in 150+ words. Master data
              analysis and clear descriptions.
            </p>
          </div>
          <div className="p-6 border border-purple-200 rounded-2xl bg-purple-50">
            <h3 className="mb-3 font-semibold text-purple-900">
              📝 Task 2 (40 min)
            </h3>
            <p className="text-sm leading-relaxed text-purple-800">
              Write academic essays with clear arguments in 250+ words. Build
              persuasive writing skills.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-section max-w-6xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            How to Practice
          </h2>
          <p className="text-base text-gray-600 sm:text-lg">
            Choose the practice mode that works best for you
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, idx) => (
            <NavLink key={feature.title} to={feature.path} className="group">
              <div className="h-full p-6 transition-all bg-white border-2 border-gray-200 cursor-pointer rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 sm:p-8">
                <div className="flex items-center justify-center w-16 h-16 mb-6 text-5xl rounded-2xl bg-linear-to-br from-blue-50 to-purple-50">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 transition group-hover:text-blue-600">
                  {feature.title}
                </h3>
                <p className="mb-4 text-base leading-relaxed text-gray-600">
                  {feature.description}
                </p>
                <div className="font-semibold text-blue-600 transition-transform group-hover:translate-x-1">
                  Get Started →
                </div>
              </div>
            </NavLink>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="home-section max-w-6xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-white/10 blur-3xl" />
          <div className="relative mb-10 text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-200 opacity-90">
              Study at a glance
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Performance highlights for IELTS writing practice
            </h2>
            <p className="mt-3 text-base leading-relaxed text-blue-100/90">
              These quick metrics show why WriteReady gives students fast,
              focused progress.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 text-left shadow-xl shadow-slate-950/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-cyan-300 via-blue-300 to-violet-400 opacity-90" />
                <p className="text-5xl font-bold text-white pt-4">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
                  for IELTS success
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Connect Section */}
      <Footer />
    </main>
  );
}

export default Home;
