import Link from 'next/link';
import { Camera } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Camera className="h-6 w-6 text-blue-600" />
          <span className="hidden font-semibold sm:inline-block">Face Attendance</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}