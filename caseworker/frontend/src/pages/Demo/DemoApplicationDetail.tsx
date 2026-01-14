import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { demoApiService, type ApplicationDetail } from '../../services/demoApi';
import { useDemoContext } from '../../context/DemoContext';
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, Calendar, User as UserIcon } from 'lucide-react';
import MinimalNavbar from '../../components/MinimalNavbar';
import ProgressTracker from '../../components/ProgressTracker';
import PhaseCard from '../../components/PhaseCard';
import AIRecommendations from '../../components/AIRecommendations';
import DemoActionPanel from '../../components/DemoActionPanel';
import { useToast } from '../../components/Toast';

/**
 * Demo Banner Component
 */
const DemoBanner: React.FC = () => {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm text-yellow-800">
        <span className="font-semibold">✨ Demo Mode</span>
        <span>•</span>
        <span>This is a demonstration. No real data will be submitted.</span>
      </div>
    </div>
  );
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getRecommendationBadge(recommendation: string | null) {
  if (!recommendation) return null;

  const recMap: Record<string, { icon: any; color: string; bgColor: string; text: string }> = {
    APPROVE: {
      icon: CheckCircle2,
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      text: 'APPROVE',
    },
    DENY: {
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      text: 'DENY',
    },
    NEEDS_REVIEW: {
      icon: AlertCircle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      text: 'NEEDS REVIEW',
    },
  };

  const config = recMap[recommendation] || recMap.NEEDS_REVIEW;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor}`}>
      <Icon className={`w-5 h-5 ${config.color}`} />
      <span className={`font-bold text-lg ${config.color}`}>{config.text}</span>
    </div>
  );
}

const PHASE_NAMES = [
  'Basic Eligibility & Insured Status',
  'Substantial Gainful Activity (SGA)',
  'Severe Impairment(s)',
  'Listed Impairments (The "Blue Book")',
  'Residual Functional Capacity (RFC) & Past Work',
  'Adjustment to Other Work (The Grid)',
];

export default function DemoApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const { showToast } = useToast();
  const { getDemoHeaders } = useDemoContext();

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  const loadApplication = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await demoApiService.getApplicationDetail(id, getDemoHeaders);
      setApplication(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseClick = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber);
    setTimeout(() => {
      const element = document.getElementById(`phase-${phaseNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Wrapper for ActionPanel that uses demo API
  const handleActionUpdate = async () => {
    await loadApplication();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MinimalNavbar />
        <DemoBanner />
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600">Loading application...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MinimalNavbar />
        <DemoBanner />
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Error loading application</h3>
                  <p className="text-sm text-red-700 mt-1">{error || 'Application not found'}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate('/demo/caseworker/dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={loadApplication}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const phases = application.ai_reasoning.phases || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalNavbar />
      <DemoBanner />
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            to="/demo/caseworker/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Header / Applicant Summary Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {application.applicant.name}
                    </h1>
                    <p className="text-sm text-gray-500 font-mono mt-1">
                      Application ID: {application.application.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted {formatDate(application.application.submitted_at)}</span>
                    <span className="text-gray-400">({formatRelativeTime(application.application.submitted_at)})</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                {getRecommendationBadge(application.application.ai_recommendation)}
                {application.application.ai_confidence !== null && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">AI Confidence</div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${application.application.ai_confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(application.application.ai_confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* AI Summary */}
            {application.application.ai_summary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">AI Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {application.application.ai_summary}
                </p>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Tracker */}
              <ProgressTracker phases={phases} onPhaseClick={handlePhaseClick} />

              {/* Phase Cards */}
              <div className="space-y-4">
                {phases && (
                  <>
                    {phases.phase_0 && (
                      <div id="phase-0">
                        <PhaseCard
                          phaseNumber={0}
                          phaseName={PHASE_NAMES[0]}
                          phaseData={phases.phase_0}
                        />
                      </div>
                    )}
                    {phases.phase_1 && (
                      <div id="phase-1">
                        <PhaseCard
                          phaseNumber={1}
                          phaseName={PHASE_NAMES[1]}
                          phaseData={phases.phase_1}
                        />
                      </div>
                    )}
                    {phases.phase_2 && (
                      <div id="phase-2">
                        <PhaseCard
                          phaseNumber={2}
                          phaseName={PHASE_NAMES[2]}
                          phaseData={phases.phase_2}
                        />
                      </div>
                    )}
                    {phases.phase_3 && (
                      <div id="phase-3">
                        <PhaseCard
                          phaseNumber={3}
                          phaseName={PHASE_NAMES[3]}
                          phaseData={phases.phase_3}
                        />
                      </div>
                    )}
                    {phases.phase_4 && (
                      <div id="phase-4">
                        <PhaseCard
                          phaseNumber={4}
                          phaseName={PHASE_NAMES[4]}
                          phaseData={phases.phase_4}
                        />
                      </div>
                    )}
                    {phases.phase_5 && (
                      <div id="phase-5">
                        <PhaseCard
                          phaseNumber={5}
                          phaseName={PHASE_NAMES[5]}
                          phaseData={phases.phase_5}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* AI Recommendations */}
              <AIRecommendations
                missingInformation={application.ai_reasoning.missing_information}
                suggestedActions={application.ai_reasoning.suggested_actions}
              />
            </div>

            {/* Right Column - Action Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <DemoActionPanel
                  applicationId={application.application.id}
                  assignment={application.assignment}
                  onUpdate={handleActionUpdate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
