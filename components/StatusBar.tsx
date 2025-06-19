"use client";

import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StatusBarProps {
  isLoading?: boolean;
  error?: string | null;
  lastSaved?: Date | null;
  onClearError?: () => void;
  className?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  isLoading = false,
  error = null,
  lastSaved = null,
  onClearError,
  className = ''
}) => {
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Don't show anything if there's no status to display
  if (!isLoading && !error && !lastSaved) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      {/* Error Banner */}
      {error && (
        <Card className="mb-2 border-destructive bg-destructive/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Storage Error
                </span>
                <span className="text-sm text-muted-foreground">
                  {error}
                </span>
              </div>
              {onClearError && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearError}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
        <div className="flex items-center gap-4">
          {/* Loading Status */}
          {isLoading && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}

          {/* Success Status */}
          {!isLoading && !error && lastSaved && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>All changes saved</span>
            </div>
          )}

          {/* Error Status */}
          {!isLoading && error && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              <span>Save failed</span>
            </div>
          )}
        </div>

        {/* Last Saved Time */}
        {lastSaved && !error && (
          <div className="flex items-center gap-1">
            <span>Last saved: {formatLastSaved(lastSaved)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
