import { useEffect, useState } from "react";

interface MobileExperienceNoticeProps {
  children: React.ReactNode;
}

function MobileExperienceNotice({ children }: MobileExperienceNoticeProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateView = () => setIsMobile(window.innerWidth < 1024);

    updateView();
    window.addEventListener("resize", updateView);

    return () => window.removeEventListener("resize", updateView);
  }, []);

  if (isMobile) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-linear-to-br from-amber-50 via-white to-orange-50 px-4 py-10 text-center sm:px-6">
        <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/80 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
            Better on larger screens
          </p>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            These pages work best on tablet or desktop.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            For the full writing experience, please switch to a tablet or
            desktop screen. The mobile layout is limited and not ideal for these
            practice pages.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Tip: use a wider screen to view prompts, timers, and writing tools
            comfortably.
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export default MobileExperienceNotice;
