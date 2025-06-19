"use client";

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorAlertProps {
  error: string;
  onDismiss: () => void;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  className = ''
}) => {
  return (
    <Card className={`mb-4 border-destructive bg-destructive/10 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-destructive mb-1">
                Storage Issue
              </h4>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorAlert;
