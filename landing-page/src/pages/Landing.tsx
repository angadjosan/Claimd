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
    <div className="bg-[#231942] text-white overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled ? 'bg-[#231942]/95 backdrop-blur-lg shadow-lg shadow-[#5E548E]/20' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <a href="/" className="text-xl font-bold tracking-tight text-white">
            Clai<span className="text-[#BE95C4]">md</span>
          </a>
          <a
            href={`${APPLICANT_URL}/demo`}
            className="text-sm font-semibold text-[#231942] bg-[#E0B1CB] hover:bg-[#BE95C4] px-6 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-[#E0B1CB]/50 hover:scale-105"
          >
            Try this workflow →
          </a>
        </div>
      </nav>

      {/* Hero Section with curved bottom */}
      <section className="relative pt-24 pb-32 px-6 bg-gradient-to-br from-[#231942] via-[#5E548E] to-[#231942] overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#9F86C0] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#E0B1CB] rounded-full opacity-10 blur-3xl"></div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'ellipse(100% 100% at 50% 100%)' }}></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5E548E]/30 border border-[#9F86C0]/50 text-[#E0B1CB] rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-[#E0B1CB] rounded-full animate-pulse"></span>
              AI-powered SSDI processing
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Process SSDI claims<br />
              <span className="bg-gradient-to-r from-[#BE95C4] via-[#E0B1CB] to-[#BE95C4] bg-clip-text text-transparent">30× faster</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-[#E0B1CB]/90 mb-10 max-w-3xl mx-auto">
              Fast, reliable, human-first automation. AI copilots handle extraction and evaluation.
              Caseworkers make the final call.
            </p>

            {/* CTA */}
            <a
              href={`${APPLICANT_URL}/demo`}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#BE95C4] to-[#E0B1CB] text-[#231942] font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-[#E0B1CB]/50 transition-all hover:scale-105 group"
            >
              Try this workflow
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-gradient-to-br from-[#5E548E]/40 to-[#9F86C0]/40 backdrop-blur-sm p-8 rounded-3xl border border-[#9F86C0]/30 hover:border-[#BE95C4] transition-all hover:scale-105">
              <div className="text-5xl font-bold text-[#E0B1CB] mb-2">30 sec</div>
              <div className="text-sm font-semibold text-white/90">AI processing time</div>
            </div>
            <div className="bg-gradient-to-br from-[#9F86C0]/40 to-[#BE95C4]/40 backdrop-blur-sm p-8 rounded-3xl border border-[#BE95C4]/30 hover:border-[#E0B1CB] transition-all hover:scale-105">
              <div className="text-5xl font-bold text-[#E0B1CB] mb-2">5-step</div>
              <div className="text-sm font-semibold text-white/90">SSA evaluation framework</div>
            </div>
            <div className="bg-gradient-to-br from-[#BE95C4]/40 to-[#E0B1CB]/40 backdrop-blur-sm p-8 rounded-3xl border border-[#E0B1CB]/30 hover:border-white transition-all hover:scale-105">
              <div className="text-5xl font-bold text-white mb-2">100%</div>
              <div className="text-sm font-semibold text-[#E0B1CB]">Human oversight</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem → Relief with offset layout */}
      <section className="relative py-20 px-6 bg-white overflow-hidden">
        {/* Curved top edge */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-br from-[#231942] via-[#5E548E] to-[#231942]" style={{ clipPath: 'ellipse(100% 100% at 50% 0%)' }}></div>

        {/* Decorative blob */}
        <div className="absolute top-40 -right-20 w-80 h-80 bg-gradient-to-br from-[#9F86C0]/10 to-[#BE95C4]/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10 pt-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Problem - offset up */}
            <div className="md:-mt-8">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#231942] to-[#5E548E] text-white text-xs font-bold rounded-full mb-4">
                THE PROBLEM
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#231942] mb-6">
                SSDI processing is slow and inconsistent
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#231942]/10 text-[#231942] rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-[#5E548E] group-hover:text-white transition-all">✕</span>
                  <span className="text-[#231942]/80 text-lg"><strong className="text-[#231942]">Hours of manual work</strong> reading PDFs, extracting data from medical records</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#231942]/10 text-[#231942] rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-[#5E548E] group-hover:text-white transition-all">✕</span>
                  <span className="text-[#231942]/80 text-lg"><strong className="text-[#231942]">Inconsistent evaluations</strong> across different caseworkers and regions</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#231942]/10 text-[#231942] rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-[#5E548E] group-hover:text-white transition-all">✕</span>
                  <span className="text-[#231942]/80 text-lg"><strong className="text-[#231942]">Long wait times</strong> for applicants who need support now</span>
                </li>
              </ul>
            </div>

            {/* Solution - offset down with gradient bg */}
            <div className="md:mt-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9F86C0]/20 to-[#BE95C4]/20 rounded-3xl -rotate-3"></div>
              <div className="relative bg-gradient-to-br from-[#231942] to-[#5E548E] p-8 rounded-3xl border border-[#9F86C0]/30 shadow-2xl shadow-[#5E548E]/20">
                <div className="inline-block px-4 py-2 bg-[#E0B1CB] text-[#231942] text-xs font-bold rounded-full mb-4">
                  THE SOLUTION
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  AI copilots speed up every step
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 group">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#E0B1CB] text-[#231942] rounded-full flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-white/90 text-lg"><strong className="text-[#E0B1CB]">30-second extraction</strong> of all relevant data from uploaded documents</span>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#E0B1CB] text-[#231942] rounded-full flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-white/90 text-lg"><strong className="text-[#E0B1CB]">Consistent SSA 5-step evaluation</strong> applied to every case automatically</span>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#E0B1CB] text-[#231942] rounded-full flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-white/90 text-lg"><strong className="text-[#E0B1CB]">Human caseworkers review & approve</strong> every decision with full context</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Walkthrough with curved transition */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-[#231942] to-[#5E548E] overflow-hidden">
        {/* Curved wave divider */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)' }}></div>

        {/* Decorative blobs */}
        <div className="absolute top-40 left-10 w-96 h-96 bg-[#9F86C0] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-[#BE95C4] rounded-full opacity-10 blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10 pt-12">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#E0B1CB]/20 border border-[#E0B1CB]/30 text-[#E0B1CB] text-xs font-bold rounded-full mb-4 backdrop-blur-sm">
              HOW IT WORKS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Three portals, one workflow
            </h2>
            <p className="text-xl text-[#E0B1CB]/90 max-w-2xl mx-auto">
              Applicant submits. AI processes. Caseworker reviews. Fast, consistent, human-first.
            </p>
          </div>

          {/* Step-by-step flow */}
          <div className="space-y-16">
            {/* Step 1: Applicant Portal - Offset left */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:-ml-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#9F86C0] to-[#BE95C4] text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-white">Applicant Portal</h3>
                </div>
                <p className="text-[#E0B1CB]/90 text-lg mb-4">
                  Simple 13-step form. Upload medical records, work history, financial docs. Guided questions make it easy.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>PDF upload (medical, financial, work records)</span>
                  </li>
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Guided form with validation</span>
                  </li>
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Real-time status tracking</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#BE95C4]/20 to-[#E0B1CB]/20 rounded-3xl rotate-3 blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl hover:scale-105 transition-transform">
                  <div className="bg-[#231942]/80 rounded-2xl p-6 shadow-lg">
                    <div className="text-xs font-bold text-[#E0B1CB] mb-4 tracking-wide">APPLICATION FORM</div>
                    <div className="space-y-3">
                      <div className="h-3 bg-[#9F86C0]/30 rounded-full w-3/4"></div>
                      <div className="h-3 bg-[#9F86C0]/30 rounded-full w-full"></div>
                      <div className="h-3 bg-[#9F86C0]/30 rounded-full w-2/3"></div>
                      <div className="mt-6 flex gap-3">
                        <div className="h-20 bg-[#5E548E]/40 rounded-xl flex-1 flex items-center justify-center text-sm text-[#E0B1CB] border border-[#9F86C0]/30">📄 Upload</div>
                        <div className="h-20 bg-[#5E548E]/40 rounded-xl flex-1 flex items-center justify-center text-sm text-[#E0B1CB] border border-[#9F86C0]/30">📄 Upload</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curved connecting line */}
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-[#BE95C4] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Step 2: AI Processing - Offset right */}
            <div className="flex flex-col md:flex-row-reverse gap-8 items-center md:-mr-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#BE95C4] to-[#E0B1CB] text-[#231942] rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-white">AI Processing Engine</h3>
                </div>
                <p className="text-[#E0B1CB]/90 text-lg mb-4">
                  Dual AI agents extract data from PDFs and evaluate using SSA{'\''}s official 5-step framework. Results in 30 seconds.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Extractor agent: Reads PDFs, structures data</span>
                  </li>
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Reasoning agent: 5-step SSA evaluation</span>
                  </li>
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Confidence score + legal citations</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E0B1CB]/20 to-[#BE95C4]/20 rounded-3xl -rotate-3 blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl hover:scale-105 transition-transform">
                  <div className="bg-[#231942]/80 rounded-2xl p-6 shadow-lg">
                    <div className="text-xs font-bold text-[#E0B1CB] mb-4 tracking-wide">AI ANALYSIS</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#BE95C4]/40 rounded-full animate-pulse border border-[#E0B1CB]/30"></div>
                        <span className="text-sm text-white/80">Extracting data...</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#9F86C0]/40 rounded-full animate-pulse border border-[#BE95C4]/30"></div>
                        <span className="text-sm text-white/80">Running 5-step eval...</span>
                      </div>
                      <div className="mt-6 p-5 bg-gradient-to-br from-[#9F86C0]/20 to-[#BE95C4]/20 rounded-xl border border-[#E0B1CB]/30">
                        <div className="text-xs font-bold text-[#E0B1CB] mb-2 tracking-wide">RECOMMENDATION</div>
                        <div className="flex items-center gap-2">
                          <div className="text-3xl font-bold bg-gradient-to-r from-[#BE95C4] to-[#E0B1CB] bg-clip-text text-transparent">Approve</div>
                          <div className="text-sm text-white/60">(Confidence: 0.92)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curved connecting line */}
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-[#BE95C4] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Step 3: Caseworker Portal - Offset left */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:-ml-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#E0B1CB] to-white text-[#231942] rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-white">Caseworker Portal</h3>
                </div>
                <p className="text-[#E0B1CB]/90 text-lg mb-4">
                  Review AI recommendations, see full context, make the final decision. Filter by status, confidence, date.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Full application context + AI reasoning</span>
                  </li>
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Approve, deny, or request more info</span>
                  </li>
                  <li className="flex items-center gap-3 group">
                    <svg className="w-6 h-6 text-[#E0B1CB] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Dashboard with filters & analytics</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9F86C0]/20 to-[#BE95C4]/20 rounded-3xl rotate-2 blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl hover:scale-105 transition-transform">
                  <div className="bg-[#231942]/80 rounded-2xl p-6 shadow-lg">
                    <div className="text-xs font-bold text-[#E0B1CB] mb-4 tracking-wide">CASEWORKER DASHBOARD</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[#5E548E]/30 rounded-xl border border-[#9F86C0]/30">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-[#BE95C4] rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-white">Application #1234</span>
                        </div>
                        <span className="text-xs text-[#E0B1CB]">Pending Review</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#5E548E]/30 rounded-xl border border-[#9F86C0]/30">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-[#9F86C0] rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-white">Application #1235</span>
                        </div>
                        <span className="text-xs text-[#E0B1CB]">Under Review</span>
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BE95C4] to-[#E0B1CB] text-[#231942] text-sm font-bold rounded-xl hover:scale-105 transition-transform">Approve</button>
                        <button className="flex-1 px-4 py-3 bg-[#231942] text-[#E0B1CB] text-sm font-bold rounded-xl border border-[#E0B1CB]/30 hover:scale-105 transition-transform">Deny</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-20">
            <a
              href={`${APPLICANT_URL}/demo`}
              className="inline-flex items-center justify-center px-12 py-5 bg-gradient-to-r from-[#BE95C4] to-[#E0B1CB] text-[#231942] font-bold text-xl rounded-full hover:shadow-2xl hover:shadow-[#E0B1CB]/50 transition-all hover:scale-110 group"
            >
              Try this workflow
              <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <p className="text-[#E0B1CB]/80 text-sm mt-5">Full demo mode • No sign-up required • Explore both portals</p>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%, 0 100%)' }}></div>
      </section>

      {/* Impact Section with diagonal split */}
      <section className="relative py-20 px-6 bg-white overflow-hidden">
        {/* Curved divider from previous section */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-[#231942] to-[#5E548E]" style={{ clipPath: 'polygon(0 0, 100% 50%, 100% 100%, 0 100%)' }}></div>

        {/* Decorative diagonal blob */}
        <div className="absolute top-40 right-0 w-1/2 h-96 bg-gradient-to-br from-[#9F86C0]/10 to-[#BE95C4]/10 rounded-l-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10 pt-16">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#9F86C0]/20 to-[#BE95C4]/20 border border-[#BE95C4]/30 text-[#231942] text-xs font-bold rounded-full mb-4">
              IMPACT
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#231942] mb-4">
              Built for speed, accuracy, consistency
            </h2>
            <p className="text-xl text-[#5E548E] max-w-2xl mx-auto">
              Real metrics from real SSDI processing workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { metric: '30×', label: 'Faster processing', desc: 'From hours to seconds', color: 'from-[#9F86C0] to-[#BE95C4]' },
              { metric: '95%', label: 'Extraction accuracy', desc: 'Structured data from PDFs', color: 'from-[#BE95C4] to-[#E0B1CB]' },
              { metric: '100%', label: 'Consistency', desc: 'Same SSA 5-step eval every time', color: 'from-[#E0B1CB] to-[#BE95C4]' },
              { metric: '100%', label: 'Human oversight', desc: 'Every decision reviewed', color: 'from-[#5E548E] to-[#9F86C0]' },
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-[#BE95C4]/30 text-center hover:scale-105 hover:shadow-2xl hover:shadow-[#9F86C0]/20 transition-all">
                  <div className={`text-6xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>{item.metric}</div>
                  <div className="text-sm font-semibold text-[#231942] mb-1">{item.label}</div>
                  <div className="text-xs text-[#5E548E]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators with curved background */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-[#5E548E] to-[#231942] overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#BE95C4] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#E0B1CB] rounded-full opacity-10 blur-3xl"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Grounded in law. Powered by AI.<br />
            <span className="bg-gradient-to-r from-[#BE95C4] to-[#E0B1CB] bg-clip-text text-transparent">Approved by humans.</span>
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'SSA 5-Step Framework', desc: 'Built on the official disability evaluation process' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Claude Haiku 4.5', desc: 'Dual AI agents for extraction + reasoning' },
              { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', title: 'Human-in-the-Loop', desc: 'Caseworkers review and approve all decisions' },
            ].map((item, i) => (
              <div key={i} className="group text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#BE95C4]/20 to-[#E0B1CB]/20 backdrop-blur-sm border border-[#E0B1CB]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <svg className="w-10 h-10 text-[#E0B1CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-2 text-lg">{item.title}</h4>
                <p className="text-sm text-[#E0B1CB]/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-br from-[#231942] via-[#5E548E] to-[#9F86C0]" style={{ clipPath: 'ellipse(120% 100% at 50% 100%)' }}></div>
      </section>

      {/* Final CTA Section with dramatic gradient */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-[#231942] via-[#5E548E] to-[#9F86C0] overflow-hidden">
        {/* Curved top from previous section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[#5E548E] to-[#231942]" style={{ clipPath: 'ellipse(120% 100% at 50% 0%)' }}></div>

        {/* Animated gradient blobs */}
        <div className="absolute top-40 left-10 w-96 h-96 bg-[#BE95C4] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-[#E0B1CB] rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to see it<br />
            <span className="bg-gradient-to-r from-[#BE95C4] via-[#E0B1CB] to-white bg-clip-text text-transparent">in action?</span>
          </h2>
          <p className="text-xl text-[#E0B1CB]/90 mb-12 max-w-2xl mx-auto">
            Full demo mode. No sign-up. Explore the applicant portal, watch AI processing, review as a caseworker.
          </p>

          <a
            href={`${APPLICANT_URL}/demo`}
            className="inline-flex items-center justify-center px-14 py-6 bg-gradient-to-r from-[#BE95C4] via-[#E0B1CB] to-white text-[#231942] font-bold text-2xl rounded-full hover:shadow-2xl hover:shadow-[#E0B1CB]/60 transition-all hover:scale-110 group"
          >
            Try this workflow
            <svg className="w-7 h-7 ml-4 group-hover:translate-x-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[#E0B1CB] text-sm">
            {['No credit card', 'No sign-up', 'Full workflow'].map((text, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-[#231942] py-8 px-6 border-t border-[#5E548E]/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-[#E0B1CB]/60 text-center leading-relaxed">
            AI-powered SSDI processing tool built with Claude Haiku 4.5. Demo mode showcases full workflow. Not affiliated with Social Security Administration. Always consult qualified disability advocates for legal guidance.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <a href="/" className="text-3xl font-bold text-white">
              Clai<span className="bg-gradient-to-r from-[#BE95C4] to-[#E0B1CB] bg-clip-text text-transparent">md</span>
            </a>
            <p className="text-sm text-[#E0B1CB]/60 mt-1">Fast, reliable, human-first SSDI processing</p>
          </div>
          <div className="text-sm text-[#E0B1CB]/60">
            © 2026 Claimd • Built for applicants and caseworkers
          </div>
        </div>
      </footer>
    </div>
  );
}
