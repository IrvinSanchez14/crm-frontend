/**
 * ErrorBoundary Organism
 * Catches React errors in component tree
 * Best Practice: Provides error recovery and user feedback
 */

import { Component, type ReactNode } from 'react';
import { Heading } from '../../atoms/Heading';
import { Text } from '../../atoms/Text';
import { Button } from '../../atoms/Button';
import { Card } from '../../atoms/Card';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md">
            <Heading level={1} className="mb-4 text-destructive">
              Something went wrong
            </Heading>
            <Text variant="muted" className="mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <div className="flex gap-4">
              <Button onClick={this.handleReset} variant="primary">
                Try again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="secondary"
              >
                Go home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

