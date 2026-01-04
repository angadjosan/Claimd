import { CheckCircle2, XCircle, AlertCircle, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface PhaseStatus {
  status: string;
  reasoning?: string;
}

interface ProgressTrackerProps {
  phases: {
    phase_0?: PhaseStatus;
    phase_1?: PhaseStatus;
    phase_2?: PhaseStatus;
    phase_3?: PhaseStatus;
    phase_4?: PhaseStatus;
    phase_5?: PhaseStatus;
  } | null;
  onPhaseClick?: (phaseNumber: number) => void;
}

const PHASE_NAMES = [
  'Eligibility',
  'SGA',
  'Severe Impairment',
  'Listings',
  'RFC & Past Work',
  'Other Work',
];

const PHASE_STATUS_COLORS: Record<string, { bg: string; border: string; icon: any; text: string }> = {
  PASS: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    icon: CheckCircle2,
    text: 'text-green-700',
  },
  FAIL: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    icon: XCircle,
    text: 'text-red-700',
  },
  WARN: {
    bg: 'bg-amber-100',
    border: 'border-amber-500',
    icon: AlertCircle,
    text: 'text-amber-700',
  },
  MET: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    icon: CheckCircle2,
    text: 'text-green-700',
  },
  NOT_MET: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    icon: XCircle,
    text: 'text-red-700',
  },
  EQUALED: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    icon: CheckCircle2,
    text: 'text-blue-700',
  },
  DISABLED: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    icon: CheckCircle2,
    text: 'text-green-700',
  },
  NOT_DISABLED: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    icon: XCircle,
    text: 'text-red-700',
  },
};

export default function ProgressTracker({ phases, onPhaseClick }: ProgressTrackerProps) {
  if (!phases) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No phase data available</p>
      </div>
    );
  }

  const phaseData = [
    phases.phase_0,
    phases.phase_1,
    phases.phase_2,
    phases.phase_3,
    phases.phase_4,
    phases.phase_5,
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Evaluation Progress</h3>
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200" />
        
        <div className="relative flex justify-between">
          {phaseData.map((phase, index) => {
            const status = phase?.status || 'UNKNOWN';
            const config = PHASE_STATUS_COLORS[status] || {
              bg: 'bg-gray-100',
              border: 'border-gray-400',
              icon: Circle,
              text: 'text-gray-600',
            };
            const Icon = config.icon;
            const isClickable = onPhaseClick !== undefined;

            return (
              <div
                key={index}
                className="relative flex flex-col items-center flex-1"
              >
                <button
                  onClick={() => onPhaseClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative z-10 w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all',
                    config.bg,
                    config.border,
                    isClickable && 'hover:scale-110 cursor-pointer',
                    !isClickable && 'cursor-default'
                  )}
                  title={`Phase ${index}: ${PHASE_NAMES[index]} - ${status}`}
                >
                  <Icon className={cn('w-6 h-6', config.text)} />
                </button>
                <div className="mt-3 text-center">
                  <div className="text-xs font-medium text-gray-900">Phase {index}</div>
                  <div className="text-xs text-gray-600 mt-1">{PHASE_NAMES[index]}</div>
                  <div className={cn('text-xs font-medium mt-1', config.text)}>
                    {status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

