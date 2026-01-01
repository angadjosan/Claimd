export default function MinimalProblem() {
  return (
    <section className="min-h-screen bg-transparent relative z-20 text-gray-900 flex items-center justify-center py-32 px-6">
      {/* Slight backdrop for readability */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="text-center mb-32">
          <div className="text-sm text-gray-500 uppercase tracking-widest mb-8">The Problem</div>
          <h2 className="text-5xl md:text-7xl font-thin mb-8 text-gray-900">
            940,000 Americans are waiting<span className="text-red-600">.</span>
          </h2>
          <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
            Social Security disability benefits take an average of 7 months to process. 
            Every day counts when you can't pay rent.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
          {/* Month Wait */}
          <div className="border-l border-gray-300 pl-8">
            <div className="text-6xl md:text-7xl font-thin text-gray-900 mb-4">7</div>
            <h3 className="text-xl font-light text-gray-900 mb-3">Month Wait</h3>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
              Average processing time leaves applicants in financial limbo
            </p>
            <div className="text-xs text-gray-500 uppercase tracking-wider">940,000 waiting</div>
          </div>

          {/* Documents */}
          <div className="border-l border-gray-300 pl-8">
            <div className="text-6xl md:text-7xl font-thin text-gray-900 mb-4">34</div>
            <h3 className="text-xl font-light text-gray-900 mb-3">Documents</h3>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
              Manual review of 34 documents per application takes 8-10 minutes
            </p>
            <div className="text-xs text-gray-500 uppercase tracking-wider">SSA workers overwhelmed</div>
          </div>

          {/* Human Error */}
          <div className="border-l border-gray-300 pl-8">
            <div className="text-6xl md:text-7xl font-thin text-gray-900 mb-4">
              <span className="text-5xl md:text-6xl">+</span>
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-3">Human Error</h3>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
              Manual processing leads to delays and inconsistencies
            </p>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Higher error rates</div>
          </div>
        </div>
      </div>
    </section>
  );
}

