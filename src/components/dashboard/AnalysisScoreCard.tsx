"use client";

import React from "react";
import ReactDOM from "react-dom";
import { GlassCard } from "@/components/GlassCard";

interface AnalysisData {
    detected_role?: string;
    overall_score?: number;
    core_score?: number;
    status?: string;
    report_text?: string;
    created_at?: string;
}

interface AnalysisScoreCardProps {
    data: AnalysisData;
}

export default function AnalysisScoreCard({ data }: AnalysisScoreCardProps) {
    const score = data.overall_score || 0;
    const coreScore = data.core_score || 0;

    // Color logic for score
    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-green-400 border-green-500 shadow-[0_0_20px_rgba(74,222,128,0.3)]";
        if (s >= 50) return "text-yellow-400 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.3)]";
        return "text-red-400 border-red-500 shadow-[0_0_20px_rgba(248,113,113,0.3)]";
    };

    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return (
        <>
            <div className="flex flex-col gap-6 h-full p-4">
                {/* Header: Role & Status */}
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            {data.detected_role || "Rol Belirsiz"}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Analiz Tarihi: {data.created_at ? new Date(data.created_at).toLocaleDateString("tr-TR") : "Yeni"}
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${data.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {data.status === 'completed' ? 'TAMAMLANDI' : 'İŞLENİYOR'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-grow">

                    {/* Left: Overall Score - Big Circle */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className={`relative w-48 h-48 rounded-full border-4 flex items-center justify-center bg-black/40 ${getScoreColor(score)}`}>
                            <div className="text-center">
                                <span className="text-5xl font-bold block">{score}</span>
                                <span className="text-xs text-white/50 uppercase tracking-widest">Genel Skor</span>
                            </div>

                            {/* Decorative Ring */}
                            <div className="absolute inset-0 rounded-full border border-white/10 scale-110 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Right: Detailed Stats */}
                    <div className="space-y-6">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-gray-300 font-medium">Çekirdek Yetkinlik Uyumu</span>
                                <span className="text-xl font-bold text-accent">{coreScore}%</span>
                            </div>
                            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent transition-all duration-1000"
                                    style={{ width: `${coreScore}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Pozisyon için kritik olan 'Core' yeteneklerin eşleşme oranı.
                            </p>
                        </div>

                        {data.report_text && (
                            <div
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors group relative"
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                </div>
                                <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Yapay Zeka Özeti (Okumak için Tıkla)
                                </h4>
                                <div className="text-sm text-gray-300 leading-relaxed max-h-[150px] overflow-hidden relative">
                                    {data.report_text}
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FULL SCREEN MODAL VIA PORTAL */}
            {isModalOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-2xl font-bold text-accent flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Detaylı Analiz Raporu
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="prose prose-invert max-w-none">
                                <p className="text-lg text-gray-300 leading-loose whitespace-pre-wrap">
                                    {data.report_text}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 bg-accent/20 hover:bg-accent/30 text-accent font-semibold rounded-lg transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
