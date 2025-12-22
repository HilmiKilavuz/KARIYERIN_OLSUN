"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NeonButton } from '@/components/NeonButton';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    const navItems = [
        { name: 'Ana Sayfa', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Simülasyon', href: '/simulation' },
        { name: 'Kişisel Bilgilerim', href: '/profile' },
    ];

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tighter text-white">
                    Kariyerin<span className="text-accent">Olsun</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden items-center gap-6 md:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-accent ${pathname === item.href ? 'text-accent' : 'text-white/70'
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                <span>{user.ad_soyad}</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-white/10 bg-[#0a0a0a] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1">
                                        <Link
                                            href="/settings"
                                            className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Ayarlar
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                logout();
                                            }}
                                            className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 hover:text-red-300"
                                        >
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white">
                                Giriş Yap
                            </Link>
                            <Link href="/register">
                                <NeonButton ariaLabel="Kayıt Ol" className="px-4 py-1.5 text-xs">
                                    Kayıt Ol
                                </NeonButton>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
