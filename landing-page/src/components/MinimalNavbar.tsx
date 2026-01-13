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
          <div className="flex items-center gap-6">
            <a
              href={`${CASEWORKER_URL}`}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              For Caseworkers
            </a>
            <a
              href={`${APPLICANT_URL}`}
              className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
