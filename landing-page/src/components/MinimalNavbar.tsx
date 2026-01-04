import './MinimalNavbar.css';

const APPLICANT_URL = import.meta.env.VITE_APPLICANT_URL || 'http://localhost:5173';
const CASEWORKER_URL = import.meta.env.VITE_CASEWORKER_URL || 'http://localhost:5191';

export default function MinimalNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <div className="text-2xl font-semibold tracking-wide gradient-text italic">
            Claimd
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={`${CASEWORKER_URL}/dashboard`}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Caseworker Portal
            </a>
            <a 
              href={`${APPLICANT_URL}/dashboard`}
              className="text-sm font-medium text-white px-6 py-2.5 rounded-full transition-all duration-200 hover:opacity-90 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
              }}
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

