"use client";

import { useState } from 'react';
import { markAttendance } from '@/lib/api';
import { WebcamCapture } from '@/components/webcam-capture';
import { AttendanceFormProps } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

export function AttendanceForm({ onSuccess, onError, onLoading }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCapture = async (imageSrc: string | null) => {
  if (!imageSrc) {
    toast({
      title: "Error",
      description: "Failed to capture image. Please try again.",
      variant: "destructive",
    });
    return;
  }

  try {
    setIsSubmitting(true);
    onLoading(true);

    // imageSrc sudah berformat data URL: 'data:image/jpeg;base64,...'
    // Jadi kita bisa langsung kirim imageSrc sebagai string lengkap (jangan split)
    const response = await markAttendance(imageSrc);

    if (response.success) {
      onSuccess({
        nip: response.nip || 'Unknown',
        nama: response.nama || 'Unknown',
        timestamp: response.timestamp || new Date().toISOString(),
        image: response.image || null,
        message: response.message || 'Attendance marked successfully!',
      });
    } else {
      throw new Error(response.message || 'Failed to mark attendance');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    onError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
    onLoading(false);
  }
  };


  return (
    <div className="w-full">
      <WebcamCapture onCapture={handleCapture} />
    </div>
  );
}