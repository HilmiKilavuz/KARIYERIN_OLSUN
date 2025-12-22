"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { NeonButton } from "@/components/NeonButton";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// CrystalTitle'ı sadece istemci tarafında yükle (SSR kapalı)
const CrystalTitle = dynamic(() => import("@/components/CrystalTitle").then(m => m.CrystalTitle), {
  ssr: false,
  loading: () => (
    <h1 className="text-4xl font-extrabold tracking-tight text-accent sm:text-5xl md:text-6xl">
      Kariyer Potansiyelini Haritalandır
    </h1>
  ),
});

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  // İstemci mount olduktan sonra interaktif animasyonları başlat
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();

  return (
    <>
      {/* HERO */}
      <section className="relative grid min-h-screen place-items-center overflow-hidden">
        {/* Aurora-style ambient lights (subtle, layered glows) */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <span className="aurora aurora-a" />
          <span className="aurora aurora-b" />
          <span className="aurora aurora-c" />
        </div>

        {/* Bokeh star field */}
        <div className="bokeh-field absolute inset-0 z-0">
          {/* bokeh dots */}
          <span className="bokeh sm" style={{ top: "12%", left: "18%", animationDuration: "22s" }} />
          <span className="bokeh md" style={{ top: "26%", left: "42%", animationDuration: "26s" }} />
          <span className="bokeh lg" style={{ top: "8%", right: "14%", animationDuration: "28s" }} />
          <span className="bokeh sm purple" style={{ top: "38%", right: "22%", animationDuration: "24s" }} />
          <span className="bokeh md" style={{ bottom: "22%", left: "24%", animationDuration: "30s" }} />
          <span className="bokeh sm" style={{ bottom: "18%", right: "30%", animationDuration: "25s" }} />
          <span className="bokeh md purple" style={{ bottom: "28%", left: "55%", animationDuration: "27s" }} />
          <span className="bokeh sm" style={{ top: "55%", left: "12%", animationDuration: "29s" }} />
        </div>

        {/* Starfield - Glowing stars with light beams */}
        <div className="starfield absolute inset-0 z-0">
          {/* Stars distributed across viewport avoiding center */}
          <span className="star star-1" />
          <span className="star star-2 purple" />
          <span className="star star-3" />
          <span className="star star-4" />
          <span className="star star-5 purple" />
          <span className="star star-6" />
          <span className="star star-7" />
          <span className="star star-8 purple" />
          <span className="star star-9" />
          <span className="star star-10" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
          <span className="text-xs uppercase tracking-widest text-muted">
            YAPAY ZEKA DESTEKLİ KARİYER SİMÜLATÖRÜ
          </span>
          {/* Başlık animasyonları sadece istemcide */}
          {isMounted ? <CrystalTitle text="Kariyer Potansiyelini Haritalandır" /> : (
            <h1 className="text-4xl font-extrabold tracking-tight text-accent sm:text-5xl md:text-6xl">
              Kariyer Potansiyelini Haritalandır
            </h1>
          )}
          <p className="text-accent/80">
            Kişiselleştirilmiş yetenek analizi, rol eşleştirme ve simülasyonlarla yol haritan netleşsin. Kararlarını veriyle al.
          </p>
          {isMounted && (
            <div className="flex gap-3">
              <NeonButton persistentGlow ariaLabel="Simülasyonu Başlat" onClick={() => router.push("/simulation")}>
                Simülasyonu Başlat
              </NeonButton>
              <NeonButton persistentGlow ariaLabel="Komuta Merkezine Git" onClick={() => router.push("/dashboard")}>
                Komuta Merkezi
              </NeonButton>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS - TIMELINE */}
      {isMounted && <TimelineSection />}
    </>
  );
}

function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  // Scroll ilerledikçe çizgi dolsun; manuel hesaplayıp daha deterministik ilerleme uygula
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // Hedef eşikleri: 0 => section top 80% viewport'a geldiğinde, 1 => section bottom viewport altına değdiğinde
      const s0 = 0.8 * vh; // start 80%
      const s1 = vh - rect.height; // end 100% => rect.bottom === vh
      const denom = Math.max(0.0001, s0 - s1);
      let p = (s0 - rect.top) / denom;

      // Sayfa en altına gelindiyse (scroll sınırı), zorla 1 yap
      const doc = document.documentElement;
      const nearBottom = window.scrollY + vh >= (doc.scrollHeight - 2);
      if (nearBottom) p = 1;

      setProgress(Math.min(1, Math.max(0, p)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true } as AddEventListenerOptions);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // SSR->CSR geçişinde inView tetiklerinin kaçmaması için client'ta yeniden mount et
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const steps = [
    {
      side: "left" as const,
      title: "CV Yükle",
      desc: "PDF veya LinkedIn profilini içe aktar; altyapı hızla tarasın.",
    },
    {
      side: "right" as const,
      title: "Analiz Et",
      desc: "Yetkinliklerini modelleyip uygun rollerle eşleştiriyoruz.",
    },
    {
      side: "left" as const,
      title: "Pratik Yap",
      desc: "Role özel simülasyonlarla gelişimin somutlaşsın.",
    },
  ];

  return (
    <section ref={ref} key={mounted ? "mounted" : "ssr"} className="relative py-32">
      <div className="relative mx-auto max-w-5xl">
        {/* Timeline rail */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -ml-px h-full w-px origin-top bg-white/10" />
          <motion.div
            className="absolute left-1/2 top-0 -ml-px h-full w-px origin-top bg-secondary will-change-transform"
            style={{ scaleY: progress }}
          />
        </div>

        <div className="relative space-y-24">
          {steps.map((s, i) => {
            const isLeft = s.side === "left";
            return (
              <div key={i} className="relative grid grid-cols-[1fr_2px_1fr] items-center gap-8">
                {/* Left column */}
                <div className="space-y-4">
                  {/* connector if left */}
                  {isLeft && (
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="ml-auto h-px w-full max-w-[520px] bg-secondary/40"
                    />
                  )}
                  {isLeft && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <GlassCard>
                        <h3 className="mb-2 text-xl font-semibold text-accent">{s.title}</h3>
                        <p className="text-accent/80">{s.desc}</p>
                      </GlassCard>
                    </motion.div>
                  )}
                </div>

                {/* Center node */}
                <div className="relative flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-secondary/70 shadow-[0_0_20px_6px_rgba(0,240,255,0.4)] animate-glow" />
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {!isLeft && (
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="mr-auto h-px w-full max-w-[520px] bg-secondary/40"
                    />
                  )}
                  {!isLeft && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <GlassCard>
                        <h3 className="mb-2 text-xl font-semibold text-accent">{s.title}</h3>
                        <p className="text-accent/80">{s.desc}</p>
                      </GlassCard>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
