 "use client"

import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8 border rounded-lg bg-red-50">
          <h2 className="text-xl font-semibold text-red-800">Có lỗi xảy ra</h2>
          <p className="text-sm text-red-600">{this.state.error?.message || 'Unknown error'}</p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4"
          >
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 
