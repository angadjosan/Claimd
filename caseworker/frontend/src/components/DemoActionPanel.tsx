import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUp,
  Stethoscope,
  Save,
} from 'lucide-react';
import { demoApiService } from '../services/demoApi';
import { useDemoContext } from '../context/DemoContext';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

interface DemoActionPanelProps {
  applicationId: string;
  assignment: {
    review_status: 'unopened' | 'in_progress' | 'completed';
    recommendation: string | null;
    reviewer_notes: string | null;
    recommendation_notes: string | null;
    priority: number;
    due_date: string | null;
    assigned_by_user: { name: string; email: string } | null;
    assigned_at: string;
    first_opened_at: string;
    last_accessed_at: string;
    completed_at: string | null;
  };
  onUpdate?: () => void;
}

const RECOMMENDATION_OPTIONS = [
  { value: 'approve', label: 'Approve', icon: CheckCircle2, color: 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200' },
  { value: 'deny', label: 'Deny', icon: XCircle, color: 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200' },
  { value: 'request_more_info', label: 'Request More Info', icon: AlertCircle, color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { value: 'escalate', label: 'Escalate', icon: ArrowUp, color: 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { value: 'needs_medical_review', label: 'Needs Medical Review', icon: Stethoscope, color: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  unopened: { bg: 'bg-gray-100', text: 'text-gray-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function DemoActionPanel({ applicationId, assignment, onUpdate }: DemoActionPanelProps) {
  const [reviewerNotes, setReviewerNotes] = useState(assignment.reviewer_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { getDemoHeaders } = useDemoContext();

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      await demoApiService.updateReviewerNotes(applicationId, reviewerNotes, getDemoHeaders);
      showToast('Notes saved successfully', 'success');
      onUpdate?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save notes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRecommendation = async (recommendation: string) => {
    try {
      setIsSaving(true);
      await demoApiService.submitRecommendation(
        applicationId,
        recommendation as any,
        getDemoHeaders
      );
      showToast('Recommendation submitted successfully', 'success');
      onUpdate?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to submit recommendation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Review Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Status</h3>
          <div className="flex items-center gap-3">
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              STATUS_COLORS[assignment.review_status].bg,
              STATUS_COLORS[assignment.review_status].text
            )}>
              {assignment.review_status.replace('_', ' ').toUpperCase()}
            </span>
            {assignment.completed_at && (
              <span className="text-sm text-gray-600">
                Completed {formatDate(assignment.completed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Reviewer Notes */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Internal Notes</h4>
          <textarea
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            placeholder="Add private notes about this application..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        {/* Recommendation Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommendation</h4>
          {assignment.recommendation ? (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                Current: <span className="font-medium">{assignment.recommendation.replace('_', ' ')}</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {RECOMMENDATION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSubmitRecommendation(option.value)}
                    disabled={isSaving}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-md border-2 transition-all text-left font-medium',
                      option.color + ' border-current',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
