"use client";

import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import SkeletonCard from "@/components/SkeletonCard";
import DevelopmentSuggestions from "@/components/dashboard/DevelopmentSuggestions";
import { EmptyState } from "@/components/common/EmptyState";
import { FileText, Video, MessageSquare, ArrowRight, Calendar, Clock } from "lucide-react";
import { useAnalysisStore } from "@/stores/useAnalysisStore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnalysisScoreCard from "@/components/dashboard/AnalysisScoreCard";

const API_BASE_URL = "http://localhost:4000/api";

interface InterviewHistoryItem {
  id: number;
  baskin_duygu: string;
  soru_sayisi: number;
  sure_saniye: number;
  created_at: string;
}

export default function DashboardPage() {
  const { status, analysisResult, error, fetchAnalysis } = useAnalysisStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewHistoryItem[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user?.id) {
      fetchAnalysis(user.id);
      fetchInterviews(user.id);
    }
  }, [user?.id, loading, router]);

  const fetchInterviews = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/interview-history/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setInterviews((data.data || []).slice(0, 3)); // Last 3 interviews
      }
    } catch (e) {
      console.error("Failed to fetch interviews:", e);
    } finally {
      setInterviewsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short"
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-accent">Yukleniyor...</div>;
  if (!user) return null;

  const isLoading = status === "uploading" || status === "analyzing";
  const hasData = status === "success" && !!analysisResult;
  const isError = status === "error";

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
      {/* Baslik */}
      <div className="mx-auto mb-8 max-w-7xl">
        <h1 className="text-3xl font-bold text-accent sm:text-4xl">Komuta Merkezi</h1>
        <p className="mt-2 text-sm text-muted">
          Sistemler Aktif, {user.ad_soyad}. Kariyer yorungesi hesaplaniyor...
        </p>
      </div>

      {/* Grid Yerlesim */}
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ust sira - iki kart */}
          {isLoading ? (
            <SkeletonCard className="min-h-[520px]" />
          ) : isError ? (
            <GlassCard className="min-h-[520px]">
              <EmptyState
                Icon={FileText}
                title="Analiz Basarisiz Oldu"
                message={error ?? "Bilinmeyen bir hata olustu."}
              />
            </GlassCard>
          ) : hasData ? (
            <GlassCard className="p-0 overflow-hidden min-h-[520px]">
              <AnalysisScoreCard data={(analysisResult as any).raw || analysisResult} />
            </GlassCard>
          ) : (
            <GlassCard className="min-h-[520px]">
              <EmptyState
                Icon={FileText}
                title="Henuz analiz yok"
                message="Baslamak icin CV yukleyin; detayli analiz sonucunuz burada olusacak."
              />
            </GlassCard>
          )}

          {isLoading ? (
            <SkeletonCard />
          ) : (
            <GlassCard>
              <h3 className="mb-4 text-lg font-semibold text-accent">Gelisim Onerileri</h3>
              <DevelopmentSuggestions reportText={(analysisResult as any)?.report_text || (analysisResult as any)?.raw?.report_text} />
            </GlassCard>
          )}

          {/* Alt sira - Mulakat Gecmisi */}
          <div className="md:col-span-2">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-accent">Mulakat Simulasyonlari Gecmisi</h3>
                  <p className="mt-1 text-accent/80 text-sm">Son denemeler ve skorlar.</p>
                </div>
                {interviews.length > 0 && (
                  <Link href="/interview-history" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                    Tumunu Gor <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {interviewsLoading ? (
                <div className="text-center py-8 text-muted">Yukleniyor...</div>
              ) : interviews.length === 0 ? (
                <EmptyState
                  Icon={Video}
                  title="Kayit bulunamadi"
                  message="Simulasyonu baslattiginizda kayitlariniz burada listelenecek."
                />
              ) : (
                <div className="space-y-3">
                  {interviews.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Mulakat #{item.id}</p>
                          <div className="flex items-center gap-3 text-xs text-muted mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(item.sure_saniye / 60)}dk
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-accent">{item.soru_sayisi}</p>
                          <p className="text-xs text-muted">Soru</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.baskin_duygu === 'Mutlu' ? 'bg-green-500/20 text-green-400' :
                            item.baskin_duygu === 'Gergin' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                          }`}>
                          {item.baskin_duygu || 'Notr'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
