"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SaveIndicatorProps {
  isLoading?: boolean;
  error?: string | null;
  lastSaved?: Date | null;
  className?: string;
}

const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isLoading = false,
  error = null,
  lastSaved = null,
  className = ''
}) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Show indicator when there's activity
  useEffect(() => {
    if (isLoading) {
      // Only show loading after 200ms delay to avoid flicker
      const showTimer = setTimeout(() => {
        setShowIndicator(true);
      }, 200);
      return () => clearTimeout(showTimer);
    } else if (error) {
      setShowIndicator(true);
      // Keep error visible longer
      const hideTimer = setTimeout(() => {
        setShowIndicator(false);
      }, 8000);
      return () => clearTimeout(hideTimer);
    } else if (lastSaved) {
      setShowIndicator(true);
      // Hide success message after 2 seconds
      const hideTimer = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
      return () => clearTimeout(hideTimer);
    } else {
      setShowIndicator(false);
    }
  }, [isLoading, error, lastSaved]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator && isOnline) {
    return null;
  }

  const getIndicatorContent = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Offline - Changes saved locally',
        bgColor: 'bg-yellow-500',
        textColor: 'text-white'
      };
    }

    if (isLoading) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Saving...',
        bgColor: 'bg-blue-500',
        textColor: 'text-white'
      };
    }

    if (error) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Save failed',
        bgColor: 'bg-red-500',
        textColor: 'text-white'
      };
    }

    if (lastSaved) {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Saved',
        bgColor: 'bg-green-600',
        textColor: 'text-white'
      };
    }

    return null;
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all duration-300
          ${content.bgColor} ${content.textColor}
          ${showIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        {content.icon}
        <span className="text-sm font-medium">{content.text}</span>
      </div>
    </div>
  );
};

export default SaveIndicator;
