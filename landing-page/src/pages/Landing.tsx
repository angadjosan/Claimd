import MinimalNavbar from '../components/MinimalNavbar';
import MinimalHero from '../components/MinimalHero';
import MinimalProblem from '../components/MinimalProblem';

// Ensure URL always has a protocol to prevent relative URL issues
const getUrlWithProtocol = (url: string, defaultUrl: string) => {
  const envUrl = url || defaultUrl;
  // If URL doesn't start with http:// or https://, add https://
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

const APPLICANT_URL = getUrlWithProtocol(import.meta.env.VITE_APPLICANT_URL, 'http://localhost:5173');

export default function Landing() {
    return (
        <div className="bg-white">
            <MinimalNavbar />
            <main>
                <MinimalHero />
                <MinimalProblem />
                {/* Solution CTA Section */}
                <section className="min-h-[60vh] bg-gradient-to-b from-white to-gray-50 relative z-20 flex items-center justify-center py-24 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-6xl font-light mb-6 text-gray-900">
                            Ready to get started?
                        </h2>
                        <p className="text-lg md:text-xl text-gray-600 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                            Join thousands of applicants who have streamlined their disability benefits application process.
                        </p>
                        <a
                            href={`${APPLICANT_URL}/dashboard`}
                            className="inline-flex items-center justify-center px-10 py-4 rounded-full text-base font-medium text-white transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)'
                            }}
                        >
                            Start Your Application
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}

