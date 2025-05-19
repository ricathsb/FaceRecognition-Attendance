"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function FaceDetectionGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="mb-6 border-blue-100 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center text-blue-800">
          <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
          Face Detection Guidelines
          <button 
            onClick={() => setIsVisible(false)} 
            className="ml-auto text-gray-400 hover:text-gray-600"
            aria-label="Close guidelines"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Position your face clearly in the center of the frame</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Ensure good lighting on your face</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Remove glasses, masks or other face coverings</span>
          </li>
          <li className="flex items-start">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>Avoid very bright backgrounds or backlighting</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}