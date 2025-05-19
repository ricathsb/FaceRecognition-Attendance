"use client";

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { WebcamCaptureProps } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const toggleCamera = useCallback(() => {
    setFacingMode(prevMode => 
      prevMode === 'user' ? 'environment' : 'user'
    );
  }, []);

  const captureImage = useCallback(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        onCapture(imageSrc);
      } else {
        onCapture(null);
      }
      setIsLoading(false);
    }, 500);
  }, [onCapture]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="relative w-full max-w-md rounded-xl overflow-hidden bg-black shadow-md transition-all duration-300 hover:shadow-lg">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-auto rounded-xl"
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleCamera}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white/90"
          aria-label="Switch camera"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={captureImage}
        disabled={isLoading}
        size="xl"
        className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        aria-label="Capture image and mark attendance"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Capturing...
          </>
        ) : (
          'Mark Attendance'
        )}
      </Button>
    </div>
  );
}