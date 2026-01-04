export default function DisabilityGlobe() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6">
          <h1 
            className="text-8xl md:text-9xl font-light italic mb-8"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundImage: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'serif'
            }}
          >
            Claimd
          </h1>
          
          {/* Paragraph below Claimd */}
          <p className="text-xl md:text-2xl text-gray-800 mb-4 leading-relaxed max-w-3xl mx-auto font-light">
            AI-powered processing reduces Social Security Disability Insurance (SSDI) wait times from <span className="font-semibold text-gray-900">7 months to under 2 days</span>
          </p>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Streamline your disability benefits application with intelligent automation
          </p>
        </div>
      </div>

      {/* Scroll down indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm font-medium text-gray-600">Scroll down</p>
          <svg 
            className="w-6 h-6 text-gray-600 animate-bounce" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

