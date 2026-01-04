import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUp,
  Stethoscope,
  Clock,
  Calendar,
  User,
  Save,
  Send,
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

interface ActionPanelProps {
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

export default function ActionPanel({ applicationId, assignment, onUpdate }: ActionPanelProps) {
  const [reviewerNotes, setReviewerNotes] = useState(assignment.reviewer_notes || '');
  const [recommendationNotes, setRecommendationNotes] = useState(assignment.recommendation_notes || '');
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(assignment.recommendation);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      await apiService.updateReviewerNotes(applicationId, reviewerNotes);
      showToast('Notes saved successfully', 'success');
      onUpdate?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save notes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRecommendation = async () => {
    if (!selectedRecommendation) {
      showToast('Please select a recommendation', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await apiService.submitRecommendation(
        applicationId,
        selectedRecommendation as any,
        recommendationNotes
      );
      showToast('Recommendation submitted successfully', 'success');
      setShowRecommendationModal(false);
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

        {/* Assignment Metadata */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment Details</h4>
          <div className="space-y-2 text-sm">
            {assignment.assigned_by_user && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Assigned by: {assignment.assigned_by_user.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Assigned: {formatDate(assignment.assigned_at)}</span>
            </div>
            {assignment.due_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Due: {formatDate(assignment.due_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <span>Priority: {assignment.priority}</span>
            </div>
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
            <button
              onClick={() => setShowRecommendationModal(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Recommendation
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Modal */}
      {showRecommendationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Submit Recommendation</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recommendation
              </label>
              <div className="grid grid-cols-1 gap-2">
                {RECOMMENDATION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedRecommendation(option.value)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-md border-2 transition-all text-left',
                        selectedRecommendation === option.value
                          ? option.color + ' border-current'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation Notes
              </label>
              <textarea
                value={recommendationNotes}
                onChange={(e) => setRecommendationNotes(e.target.value)}
                placeholder="Add notes to accompany your recommendation..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRecommendationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRecommendation}
                disabled={!selectedRecommendation || isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSaving ? 'Submitting...' : 'Submit Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

