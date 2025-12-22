"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NeonButton } from '@/components/NeonButton';
import { GlassCard } from '@/components/GlassCard';
import Link from 'next/link';

export default function RegisterPage() {
    const { register } = useAuth();
    const [adSoyad, setAdSoyad] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(email, password, adSoyad);
        } catch (error) {
            // Error is handled in context
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <GlassCard className="w-full max-w-md p-8">
                <h2 className="mb-6 text-center text-3xl font-bold text-accent">Kayıt Ol</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">Ad Soyad</label>
                        <input
                            type="text"
                            value={adSoyad}
                            onChange={(e) => setAdSoyad(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-accent"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-accent"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-white/80">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-accent"
                            required
                        />
                    </div>
                    <NeonButton ariaLabel="Kayıt Ol" className="w-full justify-center" disabled={loading}>
                        {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                    </NeonButton>
                </form>
                <div className="mt-4 text-center text-sm text-white/60">
                    Zaten hesabın var mı?{' '}
                    <Link href="/login" className="text-accent hover:underline">
                        Giriş Yap
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
