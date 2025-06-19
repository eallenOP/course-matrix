"use client";

import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Download } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private errorReportData: string = '';

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Safely prepare error report data
    try {
      this.errorReportData = JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
        localStorageData: this.getLocalStorageData(),
      }, null, 2);
    } catch (reportError) {
      console.error('Failed to prepare error report:', reportError);
      this.errorReportData = JSON.stringify({
        error: { message: error.message },
        timestamp: new Date().toISOString(),
        reportError: 'Failed to generate full report'
      }, null, 2);
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }
  }

  private getLocalStorageData() {
    try {
      const keys = ['courseMatrix_activeSemester', 'courseMatrix_startSemester', 'courseMatrix_endSemester'];
      const data: Record<string, string | null> = {};
      keys.forEach(key => {
        data[key] = localStorage.getItem(key);
      });
      return data;
    } catch {
      return { error: 'Could not access localStorage' };
    }
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleDownloadReport = () => {
    const blob = new Blob([this.errorReportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `course-matrix-error-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  private handleClearData = () => {
    const confirmed = window.confirm(
      'This will clear all your course data and restart the app. This action cannot be undone. Are you sure?'
    );
    
    if (confirmed) {
      try {
        localStorage.removeItem('courseMatrix_activeSemester');
        localStorage.removeItem('courseMatrix_startSemester');
        localStorage.removeItem('courseMatrix_endSemester');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
        alert('Failed to clear data. Please try refreshing the page manually.');
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const error = this.state.error;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground mb-6">
                  The Course Matrix app encountered an unexpected error. Your data should still be safe.
                </p>
              </div>

              {error && (
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Error Details:</h3>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="w-full" size="lg">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}
                
                <Button onClick={this.handleReload} variant="outline" className="w-full" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleDownloadReport} 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Error Report
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h3 className="font-medium mb-3 text-destructive">Emergency Options</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If the problem persists, you can try clearing all data. This will reset the app but you'll lose all your courses and progress.
                </p>
                <Button 
                  onClick={this.handleClearData} 
                  variant="destructive" 
                  className="w-full"
                >
                  Clear All Data & Restart
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  If this problem continues, please report it with the error report above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
