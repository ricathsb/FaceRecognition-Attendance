"use client";

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { WebcamCapture, WebcamCapturePropsExtended } from '@/components/webcam-capture';
import { FaceDetectionGuide } from '@/components/face-detection-guide';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignUpPage() {
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (setter: (val: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleImageCaptured: WebcamCapturePropsExtended['onCapture'] = (src) => {
    setImageSrc(src);
    setSubmitMessage(src ? "Foto berhasil diambil." : "Gagal mengambil foto.");
  };

  const handleSubmit = async () => {
    if (!nama || !nim || !imageSrc) {
      setSubmitMessage("Nama, NIM, dan foto wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("Mendaftarkan akun...");

    try {
    const response = await fetch('http://localhost:5000/register-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, nim, fotoWajah: imageSrc }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Gagal mendaftar.");

    setSubmitMessage(`Pendaftaran untuk ${nama} (${nim}) berhasil! Anda akan diarahkan ke halaman absensi.`);
    setTimeout(() => {
      router.push('/');
    }, 2500);

    } catch (error: any) {
      setSubmitMessage(error.message || "Terjadi kesalahan saat pendaftaran.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[calc(100vh-var(--navbar-height,4rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Pendaftaran Akun Baru</h1>
            <p className="text-muted-foreground">Isi data dan ambil foto wajah Anda.</p>
          </div>

          {/* BOX INPUT NAMA & NIM DENGAN STYLING CARD */}
          <div className="space-y-4 p-6 bg-card border rounded-lg shadow">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-card-foreground mb-1">
                Nama Lengkap
              </label>
              <input
                id="nama"
                type="text"
                value={nama}
                onChange={handleChange(setNama)}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Masukkan nama lengkap" required disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="nim" className="block text-sm font-medium text-card-foreground mb-1">
                NIM (Nomor Induk Mahasiswa)
              </label>
              <input
                id="nim"
                type="text"
                value={nim}
                onChange={handleChange(setNim)}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Masukkan NIM" required disabled={isSubmitting}
              />
            </div>
          </div>

          <FaceDetectionGuide />

          <WebcamCapture onCapture={handleImageCaptured} />

          {imageSrc && !isSubmitting && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Preview Foto:</p>
              <img src={imageSrc} alt="Preview" className="w-48 h-auto rounded border" />
            </div>
          )}

          {submitMessage && (
            <p className={`text-sm text-center p-3 rounded-md ${
              submitMessage.includes('berhasil')
                ? 'bg-green-50 text-green-700 dark:bg-green-700/20 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-700/20 dark:text-red-300'
            }`}>
              {submitMessage}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!nama || !nim || !imageSrc || isSubmitting}
            size="xl"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mendaftarkan...
              </>
            ) : 'Daftar Akun'}
          </Button>
        </motion.div>

        <footer className="w-full mt-auto pt-8 pb-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Face Attendance System</p>
        </footer>
      </main>
    </>
  );
}
