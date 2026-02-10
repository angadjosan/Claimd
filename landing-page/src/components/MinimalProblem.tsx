// Ensure URL always has a protocol to prevent relative URL issues
const getUrlWithProtocol = (url: string, defaultUrl: string) => {
  const envUrl = url || defaultUrl;
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

export default function MinimalProblem() {
  return (
    <section className="bg-card py-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Caseworkers spend 8-10 minutes per application. AI does it in 30 seconds.
        </h2>
        <a
          href={`${getUrlWithProtocol(import.meta.env.VITE_CASEWORKER_URL, 'http://localhost:5191')}/demo`}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 transition-all shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Try the workflow
        </a>
      </div>
    </section>
  );
}
