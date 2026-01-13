import MinimalNavbar from '../components/MinimalNavbar';
import MinimalHero from '../components/MinimalHero';
import MinimalProblem from '../components/MinimalProblem';

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
  return (
    <div className="bg-background">
      <MinimalNavbar />
      <main>
        <MinimalHero />
        <MinimalProblem />

        {/* Solution Section */}
        <section id="solution" className="bg-background py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-medium uppercase tracking-widest text-accent mb-4 block">
                The Solution
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                AI that actually helps people.
              </h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
                Claimd uses AI to process applications in hours, not months. Faster decisions. Fewer errors. Better outcomes.
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Submit Once</h3>
                <p className="text-sm text-foreground/60">
                  Upload your documents through our simple portal. No more paper forms.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Reviews</h3>
                <p className="text-sm text-foreground/60">
                  Our AI extracts data, checks eligibility, and prepares your case in minutes.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Get Approved</h3>
                <p className="text-sm text-foreground/60">
                  Caseworkers review AI recommendations and make faster, more accurate decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="apply" className="bg-primary py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to get the benefits you deserve?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Join thousands of applicants who have streamlined their disability benefits application.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={`${APPLICANT_URL}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors text-lg"
              >
                Start Your Application
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground/10 transition-colors text-lg"
              >
                Talk to Us
              </a>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="bg-card border-t border-border py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-3">
                Important Disclaimer
              </h3>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-4xl mx-auto">
              Claimd is not affiliated with the Social Security Administration (SSA) and does not guarantee approval of disability benefits.
              Our AI-powered tool is designed to streamline the application process and improve document organization,
              but the final decision rests solely with SSA officials. Results vary by individual case.
              This service is for informational purposes and does not constitute legal advice.
              Please consult with a qualified disability attorney or advocate for legal guidance on your specific situation.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-foreground py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-primary-foreground font-semibold text-lg">Claimd</div>
              <p className="text-primary-foreground/60 text-sm text-center md:text-left">
                Making government work faster. One application at a time.
              </p>
              <div className="text-primary-foreground/40 text-xs">
                © 2026 Claimd. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
