"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AttendanceCard } from '@/components/attendance-card';
import { AttendanceForm } from '@/components/attendance-form';
import { LoadingSpinner } from '@/components/loading-spinner';
import { FaceDetectionGuide } from '@/components/face-detection-guide';
import { Navbar } from '@/components/navbar';
import { AttendanceResponse } from '@/lib/types';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  useEffect(() => {
    const role = localStorage.getItem('role'); 
    if (!role) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false); 
    }
  }, [router]);

  const handleSuccess = (data: AttendanceResponse) => {
    setAttendanceData(data);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setAttendanceData(null);
  };

  const handleReset = () => {
    setAttendanceData(null);
    setError(null);
  };

  if (isCheckingAuth) {
    return null; // Jangan render apapun saat redirect auth
  }

  return (
    <>
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[calc(100vh-var(--navbar-height,4rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 md:text-4xl">
              Face Attendance System
            </h1>
            <p className="text-muted-foreground">
              Quickly mark your attendance with facial recognition
            </p>

            {/* Tombol Navigasi */}
            <div className="mt-4 flex justify-center gap-4">
              
              <Link
                href="/face-list"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Daftar Wajah
              </Link>
            </div>
          </div>

          <FaceDetectionGuide />

          {isLoading && <LoadingSpinner />}

          {!attendanceData && !isLoading && (
            <AttendanceForm
              onSuccess={handleSuccess}
              onError={handleError}
              onLoading={setIsLoading}
            />
          )}

          {attendanceData && !isLoading && (
            <AttendanceCard
              data={attendanceData}
              onReset={handleReset}
            />
          )}

          {error && !isLoading && !attendanceData && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
              {error}
            </div>
          )}
        </motion.div>

        <footer className="mt-auto pt-8 pb-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Face Attendance System. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
