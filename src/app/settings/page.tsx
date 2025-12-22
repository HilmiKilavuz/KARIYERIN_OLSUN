"use client";
import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

export default function SettingsPage() {
  const { user, loading: authLoading, login } = useAuth(); // login used to update context
  const router = useRouter();

  const [formData, setFormData] = useState({
    ad_soyad: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        ad_soyad: user.ad_soyad || "",
        email: user.email || ""
      }));
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSaving(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/update-profile`, {
        userId: user?.id,
        ad_soyad: formData.ad_soyad,
        email: formData.email
      });

      if (res.data.success) {
        setStatus({ type: "success", message: "Profil bilgileri güncellendi." });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.response?.data?.message || "Güncelleme başarısız." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: "error", message: "Yeni şifreler eşleşmiyor." });
      return;
    }
    if (!formData.currentPassword) {
      setStatus({ type: "error", message: "Mevcut şifrenizi girmelisiniz." });
      return;
    }

    setIsSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/update-profile`, {
        userId: user?.id,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res.data.success) {
        setStatus({ type: "success", message: "Şifre başarıyla güncellendi." });
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.response?.data?.message || "Şifre güncellenemedi." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center text-accent">Yükleniyor...</div>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-accent">Ayarlar</h1>

      {status.message && (
        <div className={`p-4 rounded-md ${status.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {status.message}
        </div>
      )}

      {/* Profil Bilgileri */}
      <GlassCard>
        <h2 className="mb-4 text-xl font-semibold text-accent">Profil Bilgileri</h2>
        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="col-span-1">
            <label htmlFor="ad_soyad" className="block text-sm font-medium text-gray-300 mb-1">Ad Soyad</label>
            <input
              id="ad_soyad"
              name="ad_soyad"
              type="text"
              value={formData.ad_soyad}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-white outline-none focus:border-accent"
              placeholder="Adınız Soyadınız"
            />
          </div>
          <div className="col-span-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">E-posta Adresi</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-white outline-none focus:border-accent"
              placeholder="ornek@mail.com"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <NeonButton type="submit" ariaLabel="Bilgileri Güncelle" className="mt-2" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Bilgileri Güncelle"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>

      {/* Şifre Değiştirme */}
      <GlassCard>
        <h2 className="mb-4 text-xl font-semibold text-accent">Şifre Değiştir</h2>
        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="col-span-1">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">Mevcut Şifre</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-white outline-none focus:border-accent"
              placeholder="••••••••"
            />
          </div>
          <div className="col-span-1">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">Yeni Şifre</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-white outline-none focus:border-accent"
              placeholder="••••••••"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Yeni Şifre (Tekrar)</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-white outline-none focus:border-accent"
              placeholder="••••••••"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <NeonButton type="submit" ariaLabel="Şifreyi Güncelle" className="mt-2" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>

      {/* Profil Fotoğrafı (Placeholder for now) */}
      <GlassCard>
        <h2 className="mb-4 text-xl font-semibold text-accent">Profil Fotoğrafı</h2>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl">
            {user.ad_soyad?.charAt(0) || "U"}
          </div>
          <NeonButton ariaLabel="Fotoğrafı Değiştir" disabled>Fotoğrafı Değiştir (Yakında)</NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}

