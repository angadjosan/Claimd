import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, FileText, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface PhaseCardProps {
  phaseNumber: number;
  phaseName: string;
  phaseData: {
    status: string;
    reasoning?: string;
    citations?: string[];
    evidence?: string[];
    [key: string]: any;
  } | null;
  supportingData?: any;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; icon: any; text: string }> = {
  PASS: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle2,
    text: 'text-green-700',
  },
  FAIL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
    text: 'text-red-700',
  },
  WARN: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertCircle,
    text: 'text-amber-700',
  },
  MET: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle2,
    text: 'text-green-700',
  },
  NOT_MET: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
    text: 'text-red-700',
  },
  EQUALED: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: CheckCircle2,
    text: 'text-blue-700',
  },
  DISABLED: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle2,
    text: 'text-green-700',
  },
  NOT_DISABLED: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
    text: 'text-red-700',
  },
};

export default function PhaseCard({ phaseNumber, phaseName, phaseData }: PhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!phaseData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Phase {phaseNumber}: {phaseName}</h4>
            <p className="text-sm text-gray-500 mt-1">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const status = phaseData.status || 'UNKNOWN';
  const config = STATUS_COLORS[status] || {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: AlertCircle,
    text: 'text-gray-700',
  };
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg border-2 p-4 transition-all', config.bg, config.border)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn('w-5 h-5', config.text)} />
          <div>
            <h4 className="font-semibold text-gray-900">
              Phase {phaseNumber}: {phaseName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-sm font-medium', config.text)}>{status}</span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
          {/* AI Reasoning */}
          {phaseData.reasoning && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">AI Reasoning</h5>
              <p className="text-sm text-gray-700 bg-white rounded-md p-3 border border-gray-200">
                {phaseData.reasoning}
              </p>
            </div>
          )}

          {/* Phase-specific data */}
          {phaseNumber === 1 && phaseData.calculated_monthly_earnings !== undefined && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Calculated Monthly Earnings</h5>
              <p className="text-lg font-bold text-gray-900">
                ${phaseData.calculated_monthly_earnings.toLocaleString()}
              </p>
            </div>
          )}

          {phaseNumber === 2 && phaseData.identified_impairments && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Identified Impairments</h5>
              <div className="flex flex-wrap gap-2">
                {phaseData.identified_impairments.map((impairment: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                  >
                    {impairment}
                  </span>
                ))}
              </div>
            </div>
          )}

          {phaseNumber === 3 && phaseData.considered_listings && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Considered Listings</h5>
              <div className="space-y-2">
                {phaseData.considered_listings.map((listing: string, idx: number) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700"
                  >
                    {listing}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phaseNumber === 4 && phaseData.estimated_rfc && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Estimated RFC</h5>
              <span className="inline-block px-4 py-2 bg-white border-2 border-blue-500 rounded-lg text-lg font-bold text-blue-700">
                {phaseData.estimated_rfc}
              </span>
              {phaseData.past_work_analysis && (
                <p className="text-sm text-gray-700 mt-2 bg-white rounded-md p-3 border border-gray-200">
                  {phaseData.past_work_analysis}
                </p>
              )}
            </div>
          )}

          {phaseNumber === 5 && phaseData.grid_rule_applied && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Grid Rule Applied</h5>
              <span className="inline-block px-4 py-2 bg-white border-2 border-blue-500 rounded-lg text-lg font-bold text-blue-700">
                {phaseData.grid_rule_applied}
              </span>
            </div>
          )}

          {/* Citations */}
          {phaseData.citations && phaseData.citations.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Citations
              </h5>
              <div className="flex flex-wrap gap-2">
                {phaseData.citations.map((citation: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {citation}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {phaseData.evidence && phaseData.evidence.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Evidence
              </h5>
              <ul className="space-y-1">
                {phaseData.evidence.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 bg-white rounded-md p-2 border border-gray-200">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

