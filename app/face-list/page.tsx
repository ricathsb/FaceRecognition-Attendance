"use client";

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { WebcamCapture, WebcamCapturePropsExtended } from '@/components/webcam-capture';
import { FaceDetectionGuide } from '@/components/face-detection-guide';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Impor fungsi registerAccount dari lib/api.ts jika kamu membuatnya terpisah
// import { registerAccount, RegisterResponse } from '@/lib/api'; // Contoh jika pakai fungsi terpisah

export default function SignUpPage() {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
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
    if (!nama || !nip || !imageSrc) {
      setSubmitMessage("Nama, NIP, dan foto wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("Mendaftarkan akun...");

    try {
      const response = await fetch('/api/karyawan/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, nip, fotoWajah: imageSrc }),
      });

      // Selalu coba baca body respons, karena server mungkin mengirim pesan error dalam JSON
      // bahkan jika statusnya bukan OK.
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Jika gagal parse JSON (misalnya server kirim HTML error mentah)
        // dan statusnya juga tidak OK, maka ini masalah komunikasi/server error.
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}. Respons bukan JSON.`);
        }
        // Jika status OK tapi bukan JSON, ini aneh, tapi kita throw error juga.
        throw new Error("Respons dari server bukan JSON yang valid meskipun status OK.");
      }

      if (!response.ok) {
        // Gunakan pesan error dari server (data.message) jika ada.
        throw new Error(data.message || `Gagal mendaftar. Status: ${response.status}`);
      }

      setSubmitMessage(data.message || `Pendaftaran untuk ${nama} (${nip}) berhasil! Anda akan diarahkan ke halaman utama.`);
      setTimeout(() => {
        router.push('/');
      }, 2500);

    } catch (error: any) {
      console.error("Error saat handleSubmit di SignUpPage:", error);
      if (error.message.includes("Unexpected token '<'") || error.message.includes("Respons bukan JSON")) {
        setSubmitMessage("Terjadi kesalahan komunikasi dengan server. Pastikan endpoint API sudah benar dan server tidak error (cek log server!).");
      } else {
        setSubmitMessage(error.message || "Terjadi kesalahan saat pendaftaran.");
      }
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
            <h1 className="text-3xl font-bold mb-2">Pendaftaran Akun Karyawan</h1>
            <p className="text-muted-foreground">Isi data dan ambil foto wajah Anda.</p>
          </div>

          <div className="space-y-4 p-6 bg-card border rounded-lg shadow">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-card-foreground mb-1">
                Nama Lengkap
              </label>
              <Input
                id="nama"
                type="text"
                value={nama}
                onChange={handleChange(setNama)}
                className="mt-1 block w-full"
                placeholder="Masukkan nama lengkap" required disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="nip" className="block text-sm font-medium text-card-foreground mb-1">
                NIP (Nomor Induk Pegawai)
              </label>
              <Input
                id="nip"
                type="text"
                value={nip}
                onChange={handleChange(setNip)}
                className="mt-1 block w-full"
                placeholder="Masukkan NIP" required disabled={isSubmitting}
              />
            </div>
          </div>

          <FaceDetectionGuide />
          <WebcamCapture onCapture={handleImageCaptured} />

          {imageSrc && !isSubmitting && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Preview Foto:</p>
              <img src={imageSrc} alt="Preview" className="w-48 h-auto rounded border mx-auto" />
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
            disabled={!nama || !nip || !imageSrc || isSubmitting}
            size="lg"
            className="w-full"
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