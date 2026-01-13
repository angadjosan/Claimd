export default function MinimalProblem() {
  return (
    <section className="bg-card py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-widest text-primary mb-4 block">
            The Problem
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            The system is broken.
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            940,000 Americans are waiting for disability benefits while the SSA drowns in paperwork.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat card 1 */}
          <div className="bg-background rounded-2xl p-8 border border-border">
            <div className="text-5xl md:text-6xl font-bold text-primary mb-4">7</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Months Average Wait</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Applicants wait over half a year while struggling to pay rent, buy food, and cover medical costs.
            </p>
          </div>

          {/* Stat card 2 */}
          <div className="bg-background rounded-2xl p-8 border border-border">
            <div className="text-5xl md:text-6xl font-bold text-primary mb-4">34</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Documents Per Case</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Each application requires manual review of dozens of documents, taking caseworkers 8-10 minutes each.
            </p>
          </div>

          {/* Stat card 3 */}
          <div className="bg-background rounded-2xl p-8 border border-border">
            <div className="text-5xl md:text-6xl font-bold text-destructive mb-4">63%</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Initial Denial Rate</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Most applications are denied on first review, forcing applicants into lengthy appeals that take even longer.
            </p>
          </div>
        </div>

        {/* Solution teaser */}
        <div className="mt-16 text-center">
          <p className="text-lg text-foreground/70 mb-4">
            There's a better way.
          </p>
          <a
            href="#solution"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            See how Claimd fixes this
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
