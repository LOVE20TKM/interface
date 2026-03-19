'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useError } from '@/src/contexts/ErrorContext';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundaryImpl extends Component<
  AppErrorBoundaryProps & {
    onError: (error: Error, info: React.ErrorInfo) => void;
    onReset: () => void;
  },
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps & { onError: (error: Error, info: React.ErrorInfo) => void; onReset: () => void }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error, info);
  }

  handleRetry = () => {
    this.props.onReset();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    return (
      <div className="px-4 py-6">
        <Alert variant="destructive" className="space-y-4">
          <div className="space-y-1">
            <AlertTitle className="break-words break-all whitespace-normal">页面渲染错误</AlertTitle>
            <AlertDescription className="break-words break-all whitespace-pre-wrap">
              {error?.message || '页面发生异常，请刷新后重试。'}
            </AlertDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={this.handleRetry}>
              刷新页面
            </Button>
          </div>
        </Alert>
      </div>
    );
  }
}

export const AppErrorBoundary = ({ children }: AppErrorBoundaryProps) => {
  const { setError } = useError();

  const handleError = (error: Error, info: React.ErrorInfo) => {
    const errorMessage = error.message || '页面发生异常，请刷新后重试。';
    setError({
      name: '页面渲染错误',
      message: errorMessage,
    });

    try {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          source: 'AppErrorBoundary',
        },
        extra: {
          componentStack: info.componentStack,
        },
      });
    } catch (captureError) {
      console.warn('Sentry capture failed:', captureError);
    }
  };

  const handleReset = () => {
    setError(null);
  };

  return (
    <AppErrorBoundaryImpl onError={handleError} onReset={handleReset}>
      {children}
    </AppErrorBoundaryImpl>
  );
};
