import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // If it's a localStorage quota error, try to clear it
    if (error.name === 'QuotaExceededError') {
      try {
        localStorage.clear();
        console.log('Cleared localStorage due to quota error');
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 m-4">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Something went wrong
          </h2>
          <div className="text-red-700 mb-4">
            {this.state.error?.name === 'QuotaExceededError' ? (
              <div>
                <p className="mb-2">
                  <strong>Storage Quota Exceeded:</strong> The application has run out of browser storage space.
                </p>
                <p className="mb-2">
                  This usually happens when processing very large files. We've cleared the storage to free up space.
                </p>
                <p className="text-sm text-red-600">
                  You may need to refresh the page and try uploading smaller files or fewer files at once.
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-2">An unexpected error occurred while processing your request.</p>
                <details className="text-sm">
                  <summary className="cursor-pointer">Error details</summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                    {this.state.error?.message || 'Unknown error'}
                  </pre>
                </details>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
