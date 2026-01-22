'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, text = 'Loading' }) => {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="text-center"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-white" />
        <p className="mt-2 text-sm font-medium text-white">{text}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
