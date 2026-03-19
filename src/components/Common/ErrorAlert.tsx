'use client';
// components/common/ErrorAlert.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useError } from '@/src/contexts/ErrorContext';

export const ErrorAlert = () => {
  const { error } = useError();
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="break-words break-all whitespace-normal">{error.name}</AlertTitle>
      <AlertDescription className="break-words break-all whitespace-pre-wrap">{error.message}</AlertDescription>
    </Alert>
  );
};
