'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-5 text-center">
          <div className="text-[64px] mb-4 opacity-30">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-[15px] mb-6 max-w-[400px]">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="inline-flex items-center justify-center px-8 py-3 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 cursor-pointer"
          >
            <i className="fas fa-redo"></i> Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 p-4 bg-red-50 text-red-600 rounded-[8px] text-[13px] text-left max-w-[600px] overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
