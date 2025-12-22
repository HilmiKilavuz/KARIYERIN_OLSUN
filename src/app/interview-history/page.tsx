"use client";

import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, TrendingUp, MessageSquare } from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api";

interface InterviewHistoryItem {
    id: number;
    user_id: number;
    sorular: Array<{
        question?: string;
        answer?: string;
        dominantEmotion?: string;
        emotion?: string;
        aiScore?: string;
        score?: string;
        AI?: string;
        Soru?: string;
        Cevap?: string;
    }>;
    baskin_duygu: string;
    toplam_kirpma: number;
    sure_saniye: number;
    soru_sayisi: number;
    status: string;
    created_at: string;
}

export default function InterviewHistoryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInterview, setSelectedInterview] = useState<InterviewHistoryItem | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user?.id) {
            fetchHistory(user.id);
        }
    }, [user, loading, router]);

    const fetchHistory = async (userId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/interview-history/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.data || []);
            }
        } catch (e) {
            console.error("Failed to fetch interview history:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}dk ${secs}sn`;
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-accent">Yukleniyor...</div>;
    }

    if (!user) return null;

    return (
        <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition">
                        <ArrowLeft className="w-6 h-6 text-accent" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-accent">Mulakat Gecmisi</h1>
                        <p className="mt-1 text-sm text-muted">Tum mulakat kayitlariniz</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center text-accent py-20">Yukleniyor...</div>
                ) : history.length === 0 ? (
                    <GlassCard className="text-center py-20">
                        <MessageSquare className="w-16 h-16 text-accent/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-accent mb-2">Henuz mulakat kaydi yok</h3>
                        <p className="text-muted mb-6">Mulakat simulasyonunu tamamladiginizda kayitlariniz burada gorunecek.</p>
                        <Link href="/simulation" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition inline-block">
                            Mulakat Baslat
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <GlassCard
                                key={item.id}
                                className="cursor-pointer hover:border-accent/40 transition"
                                onClick={() => setSelectedInterview(selectedInterview?.id === item.id ? null : item)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6 text-accent" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                Mulakat #{history.length - history.indexOf(item)}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(item.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDuration(item.sure_saniye)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-accent">{item.soru_sayisi}</p>
                                            <p className="text-xs text-muted">Soru</p>
                                        </div>
                                        <div className="text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.baskin_duygu === 'Mutlu' ? 'bg-green-500/20 text-green-400' :
                                                item.baskin_duygu === 'Gergin' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {item.baskin_duygu || 'Notr'}
                                            </span>
                                            <p className="text-xs text-muted mt-1">Duygu</p>
                                        </div>
                                        <TrendingUp className={`w-5 h-5 transition ${selectedInterview?.id === item.id ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {selectedInterview?.id === item.id && item.sorular && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <h4 className="text-sm font-semibold text-accent mb-4">Soru-Cevap Detaylari</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm table-fixed">
                                                <thead className="text-xs uppercase bg-black/20 text-gray-400">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left w-12">#</th>
                                                        <th className="px-3 py-2 text-left w-1/4">Soru</th>
                                                        <th className="px-3 py-2 text-left w-1/4">Cevap</th>
                                                        <th className="px-3 py-2 text-left w-20">Duygu</th>
                                                        <th className="px-3 py-2 text-left w-1/3">AI Puanlama</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {item.sorular.map((qa, idx) => (
                                                        <tr key={idx} className="border-b border-white/5 align-top">
                                                            <td className="px-3 py-3 text-white">{idx + 1}</td>
                                                            <td className="px-3 py-3">
                                                                <div className="text-gray-300 text-sm break-words whitespace-pre-wrap">
                                                                    {qa.question || qa.Soru || '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="text-gray-300 text-sm break-words whitespace-pre-wrap">
                                                                    {qa.answer || qa.Cevap || '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className={`px-2 py-1 rounded text-xs ${(qa.dominantEmotion || qa.emotion) === 'Mutlu' ? 'bg-green-500/20 text-green-400' :
                                                                    (qa.dominantEmotion || qa.emotion) === 'Gergin' ? 'bg-red-500/20 text-red-400' :
                                                                        'bg-gray-500/20 text-gray-400'
                                                                    }`}>
                                                                    {qa.dominantEmotion || qa.emotion || 'Notr'}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="text-xs text-gray-300 whitespace-pre-wrap break-words bg-black/30 p-2 rounded">
                                                                    {qa.aiScore || qa.score || qa.AI || 'Puanlama yok'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
