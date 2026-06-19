function MobileAlert() {
  return (
    <section className="border-b lg:hidden border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(251,191,36,0.18)] animate-pulse" />
          <p className="text-sm font-semibold text-amber-900">
            Best viewed on desktop or tablet for the full writing experience.
          </p>
        </div>
        <p className="text-xs text-amber-800/90 sm:text-sm">
          This reminder appears only on the homepage. Other pages keep their
          standard layout, so you will not see this mobile note there.
        </p>
      </div>
    </section>
  );
}

export default MobileAlert;
