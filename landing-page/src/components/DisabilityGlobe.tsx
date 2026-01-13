export default function DisabilityGlobe() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background pt-24">
      {/* Hero Content */}
      <div className="max-w-5xl mx-auto px-6 py-24">
        {/* Mission statement badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Making government work faster
          </span>
        </div>

        {/* Main headline - bold and opinionated */}
        <h1 className="text-5xl md:text-7xl font-bold text-center text-foreground leading-tight mb-6">
          Disability benefits in{' '}
          <span className="text-primary">days</span>,{' '}
          <br className="hidden md:block" />
          not months.
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-center text-foreground/70 max-w-3xl mx-auto mb-12 leading-relaxed">
          AI-powered processing reduces SSDI wait times from{' '}
          <span className="font-semibold text-foreground">7 months</span> to{' '}
          <span className="font-semibold text-accent">under 48 hours</span>.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-primary">940K</div>
            <div className="text-sm text-foreground/60 mt-1">Americans waiting</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-primary">7 mo</div>
            <div className="text-sm text-foreground/60 mt-1">Average wait time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-accent">&lt;48 hrs</div>
            <div className="text-sm text-foreground/60 mt-1">With Claimd</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="#apply"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-lg"
          >
            Start Your Application
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors text-lg"
          >
            See How It Works
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-foreground/40">
          <span className="text-xs font-medium uppercase tracking-wider">Scroll</span>
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
