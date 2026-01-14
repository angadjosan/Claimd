// Ensure URL always has a protocol to prevent relative URL issues
const getUrlWithProtocol = (url: string, defaultUrl: string) => {
  const envUrl = url || defaultUrl;
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

export default function DisabilityGlobe() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background pt-24">
      {/* Hero Content */}
      <div className="max-w-5xl mx-auto px-6 py-24">

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-center text-foreground leading-tight mb-8">
          AI processes SSDI applications{' '}
          <span className="text-primary">in 30 seconds</span>
        </h1>

        {/* CTA Button */}
        <div className="flex justify-center">
          <a
            href={`${getUrlWithProtocol(import.meta.env.VITE_APPLICANT_URL, 'http://localhost:5173')}/demo`}
            className="inline-flex items-center justify-center px-10 py-5 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 transition-all text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Try the workflow
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
