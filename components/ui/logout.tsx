'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        router.push('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="px-3 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
            Keluar
        </button>
    );
}
