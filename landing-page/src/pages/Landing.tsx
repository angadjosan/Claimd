import { useState, useEffect } from 'react';

// Ensure URL always has a protocol to prevent relative URL issues
const getUrlWithProtocol = (url: string, defaultUrl: string) => {
  const envUrl = url || defaultUrl;
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

const APPLICANT_URL = getUrlWithProtocol(import.meta.env.VITE_APPLICANT_URL, 'http://localhost:5173');

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <a href="/" className="text-xl font-bold tracking-tight text-gray-900">
            Clai<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">md</span>
          </a>
          <a
            href={`${APPLICANT_URL}/demo`}
            className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-6 py-2.5 rounded-full transition-all"
          >
            Try demo
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute left-1/3 top-[100px] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* NEW / PROOF pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 mb-8">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">NEW</span>
            <span>Caseworker Copilot for Social Security</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
            Government at{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              startup speed
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-3xl mx-auto text-center text-xl leading-relaxed text-gray-600 no-underline">
            AI handles the paperwork. Caseworkers make the call. <span className="text-gray-900">30× faster.</span>
          </p>

          {/* CTA */}
          <div className="mt-10 flex items-center justify-center gap-6">
            <a
              href={`${APPLICANT_URL}/demo`}
              className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-lg rounded-full hover:shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105 group"
            >
              Try the demo
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a className="text-gray-600 hover:text-gray-900 transition" href="#how">
              See how it works →
            </a>
          </div>

          {/* Micro-benefits */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>✓ Human-in-the-loop</span>
            <span>✓ Audit-ready</span>
            <span>✓ SSA workflows</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-32 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-24">
            How it works
          </h2>

          {/* 3-step workflow */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group">
              <div className="mb-8 p-8 bg-gray-50 backdrop-blur-xl border border-gray-200 rounded-2xl hover:border-blue-600/50 hover:bg-gray-100 transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-600/10 to-cyan-500/5 rounded-xl flex items-center justify-center mb-6">
                  {/* Applicant UI mockup */}
                  <div className="w-full max-w-[200px] space-y-3 px-6">
                    <div className="h-2 bg-gray-300 rounded-full w-3/4"></div>
                    <div className="h-2 bg-gray-300 rounded-full w-full"></div>
                    <div className="h-2 bg-gray-300 rounded-full w-2/3"></div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-16 bg-white backdrop-blur rounded-lg flex-1 flex items-center justify-center text-2xl border border-gray-200">📄</div>
                      <div className="h-16 bg-white backdrop-blur rounded-lg flex-1 flex items-center justify-center text-2xl border border-gray-200">📄</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">1</div>
                <h3 className="text-xl font-bold text-gray-900">Apply</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                13-step form with document upload. Medical records, work history, and financial information.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-8 p-8 bg-gray-50 backdrop-blur-xl border border-gray-200 rounded-2xl hover:border-blue-600/50 hover:bg-gray-100 transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-cyan-500/10 to-blue-600/5 rounded-xl flex items-center justify-center mb-6">
                  {/* AI processing mockup */}
                  <div className="w-full max-w-[200px] space-y-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="h-1.5 bg-gray-300 rounded-full flex-1"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="h-1.5 bg-gray-300 rounded-full flex-1"></div>
                    </div>
                    <div className="mt-6 p-3 bg-white backdrop-blur rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Recommendation</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Approve</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">2</div>
                <h3 className="text-xl font-bold text-gray-900">AI evaluates</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Dual agents extract data and run SSA 5-step evaluation. Complete in 30 seconds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-8 p-8 bg-gray-50 backdrop-blur-xl border border-gray-200 rounded-2xl hover:border-blue-600/50 hover:bg-gray-100 transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-600/10 to-cyan-500/5 rounded-xl flex items-center justify-center mb-6">
                  {/* Caseworker UI mockup */}
                  <div className="w-full max-w-[200px] space-y-2 px-6">
                    <div className="p-3 bg-white backdrop-blur rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <div className="text-xs text-gray-900 font-semibold">App #1234</div>
                      </div>
                      <div className="text-[10px] text-gray-500">Pending</div>
                    </div>
                    <div className="p-3 bg-white backdrop-blur rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                        <div className="text-xs text-gray-900 font-semibold">App #1235</div>
                      </div>
                      <div className="text-[10px] text-gray-500">Review</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-md flex items-center justify-center text-xs font-bold text-white">Approve</div>
                      <div className="flex-1 h-8 bg-white backdrop-blur rounded-md flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200">Deny</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">3</div>
                <h3 className="text-xl font-bold text-gray-900">Human decides</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Caseworker reviews AI recommendation with full context and makes final decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="relative py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">
            Built on law. Powered by AI. <br/>Approved by humans.
          </h2>

          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">30×</div>
              <div className="text-gray-600">Faster than manual</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">5-step</div>
              <div className="text-gray-600">SSA framework</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-gray-600">Human reviewed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-40 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Try the demo
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-xl mx-auto">
            No sign-up. Full workflow. See how AI and humans work together.
          </p>

          <a
            href={`${APPLICANT_URL}/demo`}
            className="inline-flex items-center justify-center px-12 py-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xl rounded-full hover:shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105 group"
          >
            Start demo
            <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <a href="/" className="text-2xl font-bold text-gray-900">
              Clai<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">md</span>
            </a>
          </div>
          <div className="text-sm text-gray-500 text-center md:text-right max-w-2xl">
            © {new Date().getFullYear()} Claimd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
