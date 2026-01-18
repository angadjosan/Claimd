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
    <div className="bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <a href="/" className="text-xl font-bold tracking-tight text-white">
            Clai<span className="bg-gradient-to-r from-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent">md</span>
          </a>
          <a
            href={`${APPLICANT_URL}/demo`}
            className="text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:from-[#7C3AED] hover:to-[#DB2777] px-6 py-2.5 rounded-full transition-all"
          >
            Try demo
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute left-1/3 top-[100px] h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* NEW / PROOF pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 mb-8">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/80">NEW</span>
            <span>Caseworker Copilot for Social Security</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Government at{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
              startup speed
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-3xl mx-auto text-center text-xl leading-relaxed text-white/65 no-underline">
            AI handles the paperwork. Caseworkers make the call. <span className="text-white/85">30× faster.</span>
          </p>

          {/* CTA */}
          <div className="mt-10 flex items-center justify-center gap-6">
            <a
              href={`${APPLICANT_URL}/demo`}
              className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-semibold text-lg rounded-full hover:shadow-2xl hover:shadow-[#EC4899]/50 transition-all hover:scale-105 group"
            >
              Try the demo
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a className="text-white/70 hover:text-white transition" href="#how">
              See how it works →
            </a>
          </div>

          {/* Micro-benefits */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/60">
            <span>✓ Human-in-the-loop</span>
            <span>✓ Audit-ready</span>
            <span>✓ SSA workflows</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-gradient-to-b from-[#A78BFA] to-[#EC4899] rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-32 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-24">
            How it works
          </h2>

          {/* 3-step workflow */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group">
              <div className="mb-8 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-[#8B5CF6]/50 hover:bg-white/[0.07] transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-[#8B5CF6]/20 to-[#EC4899]/10 rounded-xl flex items-center justify-center mb-6">
                  {/* Applicant UI mockup */}
                  <div className="w-full max-w-[200px] space-y-3 px-6">
                    <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
                    <div className="h-2 bg-white/20 rounded-full w-full"></div>
                    <div className="h-2 bg-white/20 rounded-full w-2/3"></div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-16 bg-white/10 backdrop-blur rounded-lg flex-1 flex items-center justify-center text-2xl border border-white/20">📄</div>
                      <div className="h-16 bg-white/10 backdrop-blur rounded-lg flex-1 flex items-center justify-center text-2xl border border-white/20">📄</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-sm font-bold text-white">1</div>
                <h3 className="text-xl font-bold text-white">Apply</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                13-step form with document upload. Medical records, work history, and financial information.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-8 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-[#8B5CF6]/50 hover:bg-white/[0.07] transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/10 rounded-xl flex items-center justify-center mb-6">
                  {/* AI processing mockup */}
                  <div className="w-full max-w-[200px] space-y-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#A78BFA] rounded-full animate-pulse"></div>
                      <div className="h-1.5 bg-white/20 rounded-full flex-1"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#EC4899] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="h-1.5 bg-white/20 rounded-full flex-1"></div>
                    </div>
                    <div className="mt-6 p-3 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                      <div className="text-xs text-white/50 mb-1">Recommendation</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent">Approve</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-sm font-bold text-white">2</div>
                <h3 className="text-xl font-bold text-white">AI evaluates</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                Dual agents extract data and run SSA 5-step evaluation. Complete in 30 seconds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-8 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-[#8B5CF6]/50 hover:bg-white/[0.07] transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/10 rounded-xl flex items-center justify-center mb-6">
                  {/* Caseworker UI mockup */}
                  <div className="w-full max-w-[200px] space-y-2 px-6">
                    <div className="p-3 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full"></div>
                        <div className="text-xs text-white font-semibold">App #1234</div>
                      </div>
                      <div className="text-[10px] text-white/50">Pending</div>
                    </div>
                    <div className="p-3 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-[#EC4899] rounded-full"></div>
                        <div className="text-xs text-white font-semibold">App #1235</div>
                      </div>
                      <div className="text-[10px] text-white/50">Review</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 h-8 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-md flex items-center justify-center text-xs font-bold text-white">Approve</div>
                      <div className="flex-1 h-8 bg-white/10 backdrop-blur rounded-md flex items-center justify-center text-xs font-bold text-white border border-white/20">Deny</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-sm font-bold text-white">3</div>
                <h3 className="text-xl font-bold text-white">Human decides</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                Caseworker reviews AI recommendation with full context and makes final decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="relative py-32 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16">
            Built on law. Powered by AI. <br/>Approved by humans.
          </h2>

          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent mb-2">30×</div>
              <div className="text-white/60">Faster than manual</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent mb-2">5-step</div>
              <div className="text-white/60">SSA framework</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-white/60">Human reviewed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-40 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Try the demo
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-xl mx-auto">
            No sign-up. Full workflow. See how AI and humans work together.
          </p>

          <a
            href={`${APPLICANT_URL}/demo`}
            className="inline-flex items-center justify-center px-12 py-6 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-bold text-xl rounded-full hover:shadow-2xl hover:shadow-[#EC4899]/50 transition-all hover:scale-105 group"
          >
            Start demo
            <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <a href="/" className="text-2xl font-bold text-white">
              Clai<span className="bg-gradient-to-r from-[#A78BFA] to-[#EC4899] bg-clip-text text-transparent">md</span>
            </a>
          </div>
          <div className="text-sm text-white/40 text-center md:text-right max-w-2xl">
            AI-powered Social Security processing. Demo only. Not affiliated with SSA. Built with Claude Haiku 4.5.
          </div>
        </div>
      </footer>
    </div>
  );
}
