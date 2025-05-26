export interface AttendanceResponse {
  success: boolean;
  nama: string;
  nim: string;
  image: string;
  timestamp: string;
  message: string;
  error?: string;
}

export interface WebcamCaptureProps {
  onCapture: (imageSrc: string | null) => void;
}

export interface AttendanceFormProps {
  onSuccess: (data: AttendanceResponse) => void;
  onError: (error: string) => void;
  onLoading: (isLoading: boolean) => void;
}

export interface AttendanceCardProps {
  data: AttendanceResponse;
  onReset: () => void;
}