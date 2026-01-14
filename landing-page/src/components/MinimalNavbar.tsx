// Ensure URLs always have a protocol to prevent relative URL issues
const getUrlWithProtocol = (url: string, defaultUrl: string) => {
  const envUrl = url || defaultUrl;
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

const APPLICANT_URL = getUrlWithProtocol(import.meta.env.VITE_APPLICANT_URL, 'http://localhost:5173');
const CASEWORKER_URL = getUrlWithProtocol(import.meta.env.VITE_CASEWORKER_URL, 'http://localhost:5191');

export default function MinimalNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo - clean, professional */}
          <a href="/" className="text-xl font-semibold tracking-tight text-primary">
            Claimd
          </a>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <a
              href={`${APPLICANT_URL}/demo`}
              className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try the workflow
            </a>
            <a
              href={`${CASEWORKER_URL}`}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              For Caseworkers
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
