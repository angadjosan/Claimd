import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="border border-red-300 bg-red-50 p-8 mb-6">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-thin text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 font-light mb-6">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <div className="text-left bg-white border border-red-200 p-4 mb-6 text-xs font-mono overflow-auto max-h-40">
                  <p className="text-red-600 mb-2">{this.state.error.toString()}</p>
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-900 px-6 py-2 hover:bg-gray-900 hover:text-white transition-all duration-200 font-light"
              >
                Refresh Page
              </button>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-600 hover:text-gray-900 font-light"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
