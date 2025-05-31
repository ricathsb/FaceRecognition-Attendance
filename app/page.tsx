// app/page.tsx (Halaman Absensi - Halaman Utama)
"use client";

import { useState } from 'react';
import { AttendanceCard } from '@/components/attendance-card';
import { AttendanceForm } from '@/components/attendance-form';
import { LoadingSpinner } from '@/components/loading-spinner';
import { FaceDetectionGuide } from '@/components/face-detection-guide';
import { Navbar } from '@/components/navbar';
import { AttendanceResponse } from '@/lib/types';
import { motion } from 'framer-motion';
import Link from 'next/link'; 

export default function Home() {
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
            {/* ---vvv--- TAMBAHKAN LINK DI SINI ---vvv--- */}
            <p className="mt-4 text-sm"> {/* Tambahkan margin-top jika perlu */}
              Belum terdaftar?{' '}
              <Link href="/face-list" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                Daftarkan wajah Anda di sini
              </Link>
            </p>
            {/* ---^^^--- AKHIR PENAMBAHAN LINK ---^^^--- */}
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