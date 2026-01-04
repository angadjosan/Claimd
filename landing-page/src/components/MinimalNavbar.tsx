import './MinimalNavbar.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5190';
const APPLICANT_URL = import.meta.env.VITE_APPLICANT_URL || 'http://localhost:5173';
const CASEWORKER_URL = import.meta.env.VITE_CASEWORKER_URL || 'http://localhost:5191';

export default function MinimalNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/30 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <a 
            href={BASE_URL}
            className="text-xl font-weight: 1400; tracking-wide gradient-text italic"
          >
            Claimd
          </a>
          <div className="flex items-center space-x-8">
            <a 
              href={BASE_URL}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Home
            </a>
            <a 
              href={`${APPLICANT_URL}/dashboard`}
              className="text-sm text-gray-900 border border-gray-900 px-4 py-2 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200"
            >
              Dashboard
            </a>
            <a 
              href={`${CASEWORKER_URL}/dashboard`}
              className="text-sm text-gray-900 border border-gray-900 px-4 py-2 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200"
            >
              Caseworker Portal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

