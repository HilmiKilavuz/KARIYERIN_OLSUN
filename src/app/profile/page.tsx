"use client";

import React, { useEffect, useState, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

interface ProfileData {
    cv_file_path?: string;
    ad_soyad?: string;
    e_posta?: string;
    telefon_numarasi?: string;
    adres?: string;
    linkedin_url?: string;
    github_url?: string;
    egitim_bilgileri?: any[];
    deneyim?: any[];
    yetenekler?: string[];
    sertifikalar?: string[];
    diller?: string[];
    projeler?: any[];
    ozet?: string;
    cv_raw_text?: string;
}

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Draft State
    const [draftId, setDraftId] = useState<number | null>(null);
    const [isDraftMode, setIsDraftMode] = useState(false);

    // Editable Form Data
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = () => {
        if (!user) return;
        setLoading(true);
        axios.get(`${API_BASE_URL}/auth/profile/${user.id}`)
            .then(res => {
                if (res.data.success) {
                    const draft = res.data.draft;
                    const finalProfile = res.data.profile || {};

                    let activeData = finalProfile;
                    let isDraft = false;

                    if (draft) {
                        activeData = draft;
                        isDraft = true;
                        setDraftId(draft.id);
                        console.log("Taslak CV verisi yüklendi.");
                    } else {
                        setDraftId(null);
                    }

                    // Helper to parse JSON fields if they come as strings
                    const parseList = (val: any) => {
                        if (typeof val === 'string') {
                            try { return JSON.parse(val); } catch (e) { return []; }
                        }
                        return Array.isArray(val) ? val : [];
                    };

                    // Ensure complex fields are arrays
                    activeData = {
                        ...activeData,
                        egitim_bilgileri: parseList(activeData.egitim_bilgileri),
                        deneyim: parseList(activeData.deneyim),
                        projeler: parseList(activeData.projeler),
                        yetenekler: parseList(activeData.yetenekler),
                        sertifikalar: parseList(activeData.sertifikalar),
                        diller: parseList(activeData.diller),
                    };

                    setIsDraftMode(isDraft);
                    setProfile(activeData);

                    // Helper to normalize separators (/, &, |, etc.) to commas
                    const normalizeSeparators = (arr: any[]) => {
                        return arr
                            .map((item: any) => {
                                if (typeof item === 'string') {
                                    // Replace /, &, |, and other separators with comma
                                    return item.replace(/[\\/&|]/g, ',');
                                }
                                return item;
                            })
                            .join(', ')
                            .split(',')
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                            .join(', ');
                    };

                    // Initialize Form Data with all possible fields
                    setFormData({
                        ad_soyad: activeData.ad_soyad || user.ad_soyad || "",
                        e_posta: activeData.e_posta || user.email || "",
                        telefon_numarasi: activeData.telefon_numarasi || "",
                        adres: activeData.adres || "",
                        linkedin_url: activeData.linkedin_url || "",
                        github_url: activeData.github_url || "",
                        // Complex fields with normalized separators
                        yetenekler: Array.isArray(activeData.yetenekler) ? normalizeSeparators(activeData.yetenekler) : "",
                        sertifikalar: Array.isArray(activeData.sertifikalar) ? normalizeSeparators(activeData.sertifikalar) : "",
                        diller: Array.isArray(activeData.diller) ? normalizeSeparators(activeData.diller) : "",
                        // Complex Arrays (Now Editable)
                        egitim_bilgileri: activeData.egitim_bilgileri || [],
                        deneyim: activeData.deneyim || [],
                        projeler: activeData.projeler || [],
                    });
                }
            })
            .catch(err => console.error("Profile fetch error", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        } else if (user?.id) {
            fetchProfile();
        }
    }, [user?.id, authLoading, router]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.type !== "application/pdf") {
            alert("Lütfen sadece PDF dosyası yükleyin.");
            return;
        }

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append("cvFile", file);
        uploadData.append("userId", String(user.id));

        try {
            const res = await axios.post(`${API_BASE_URL}/upload-cv`, uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                alert("CV Analizi Tamamlandı! Lütfen bilgilerinizi kontrol edip kaydedin.");
                fetchProfile();
            }
        } catch (error) {
            console.error("Upload error", error);
            alert("CV yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setUploading(false);
        }
    };

    // --- Array Manipulation Helpers ---
    const handleArrayChange = (section: string, index: number, field: string, value: string) => {
        setFormData((prev: any) => {
            const list = [...(prev[section] || [])];
            list[index] = { ...list[index], [field]: value };
            return { ...prev, [section]: list };
        });
    };

    const addItem = (section: string, emptyItem: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [section]: [...(prev[section] || []), emptyItem]
        }));
    };

    const removeItem = (section: string, index: number) => {
        setFormData((prev: any) => {
            const list = [...(prev[section] || [])];
            list.splice(index, 1);
            return { ...prev, [section]: list };
        });
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);

        // Convert comma-separated strings back to arrays
        const processedData = {
            ...formData,
            yetenekler: formData.yetenekler ? formData.yetenekler.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
            sertifikalar: formData.sertifikalar ? formData.sertifikalar.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
            diller: formData.diller ? formData.diller.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        };

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/update-profile`, {
                userId: user.id,
                profileData: processedData,
                draftId: draftId
            });
            if (res.data.success) {
                alert("Profil başarıyla kaydedildi!");
                fetchProfile();
            }
        } catch (error) {
            console.error("Update error", error);
            alert("Kaydetme başarısız.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleDeleteCv = async () => {
        if (!user || !confirm("Baştan başlamak istediğinize emin misiniz?")) return;
        setLoading(true);
        // Implement delete logic if needed, currently resets local state mostly
        setProfile(null);
        setDraftId(null);
        setIsDraftMode(false);
        setLoading(false);
    };

    if (authLoading || loading) return <div className="flex h-screen items-center justify-center text-accent animate-pulse">Yükleniyor...</div>;
    if (!user) return null;

    const hasCv = !!profile?.cv_file_path || isDraftMode || !!profile?.ad_soyad; // Expanded check

    // -- UPLOAD SCREEN --
    if (!hasCv) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-20 text-center">
                <GlassCard className="p-10 flex flex-col items-center gap-6 border-accent/20">
                    <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Profilinizi Oluşturun
                    </h1>
                    <p className="text-gray-300 max-w-lg text-lg">
                        Yapay zeka asistanımız CV'nizi analiz ederek profilinizi saniyeler içinde oluşturur. PDF dosyanızı yükleyin ve arkanıza yaslanın.
                    </p>

                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />

                    <NeonButton onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-10 py-4 text-xl mt-4">
                        {uploading ? "Analiz Ediliyor..." : "CV Yükle ve Analiz Et"}
                    </NeonButton>
                </GlassCard>
            </div>
        );
    }

    // -- PROFILE VIEW --
    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${isDraftMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isDraftMode ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className={`font-semibold ${isDraftMode ? 'text-yellow-400' : 'text-green-400'}`}>
                        {isDraftMode ? "TASLAK MODU - Lütfen Bilgileri Kontrol Edip Kaydedin" : "ONAYLI PROFİL"}
                    </span>
                </div>
                <div className="flex gap-3">
                    {isDraftMode && (
                        <button onClick={handleDeleteCv} className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                            Vazgeç
                        </button>
                    )}
                    <NeonButton onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? "Kaydediliyor..." : (isDraftMode ? "Profili Onayla ve Kaydet" : "Değişiklikleri Kaydet")}
                    </NeonButton>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* -- LEFT COLUMN: PERSONAL INFO -- */}
                <div className="space-y-6">
                    <GlassCard className="text-center p-6">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-purple-500/40 to-blue-500/40 border-2 border-white/20 flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
                            {formData.ad_soyad?.charAt(0) || user.email?.charAt(0) || "U"}
                        </div>

                        <div className="space-y-4">
                            <InputField label="Ad Soyad" name="ad_soyad" value={formData.ad_soyad} onChange={handleInputChange} />
                            <InputField label="E-Posta" name="e_posta" value={formData.e_posta} onChange={handleInputChange} />
                            <InputField label="Telefon" name="telefon_numarasi" value={formData.telefon_numarasi} onChange={handleInputChange} />
                            <InputField label="Adres" name="adres" value={formData.adres} onChange={handleInputChange} />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-accent mb-4 border-b border-white/10 pb-2">Bağlantılar</h3>
                        <div className="space-y-4">
                            <InputField label="LinkedIn URL" name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} placeholder="https://linkedin.com/in/..." />
                            <InputField label="GitHub URL" name="github_url" value={formData.github_url} onChange={handleInputChange} placeholder="https://github.com/..." />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-accent mb-4 border-b border-white/10 pb-2">Yetenekler & Dil</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Yetenekler (Virgülle ayırın)</label>
                                <textarea
                                    name="yetenekler"
                                    value={formData.yetenekler}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-md p-3 text-sm text-white focus:border-accent outline-none min-h-[100px]"
                                    placeholder="Java, Python, React..."
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Diller (Virgülle ayırın)</label>
                                <input
                                    name="diller"
                                    value={formData.diller}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-md p-3 text-sm text-white focus:border-accent outline-none"
                                    placeholder="İngilizce, Almanca..."
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* -- RIGHT COLUMN: DETAILS -- */}
                <div className="lg:col-span-2 space-y-6">

                    {/* DENEYİM */}
                    <GlassCard className="p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-accent">#</span> İş Deneyimleri
                        </h3>

                        <div className="space-y-6">
                            {(formData.deneyim || []).map((exp: any, i: number) => (
                                <div key={i} className="relative pl-6 border-l-2 border-white/10 hover:border-accent transition-colors group">
                                    <div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-gray-600 group-hover:bg-accent transition-colors border border-black" />

                                    <button
                                        onClick={() => removeItem('deneyim', i)}
                                        className="absolute right-0 top-0 text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Sil
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <input
                                            value={exp.pozisyon || ""}
                                            onChange={(e) => handleArrayChange('deneyim', i, 'pozisyon', e.target.value)}
                                            placeholder="Pozisyon"
                                            className="bg-transparent border-b border-white/10 focus:border-accent text-lg font-medium text-white w-full outline-none py-1"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                value={exp.sirket || ""}
                                                onChange={(e) => handleArrayChange('deneyim', i, 'sirket', e.target.value)}
                                                placeholder="Şirket"
                                                className="bg-transparent border-b border-white/10 focus:border-accent text-sm text-white/80 w-1/2 outline-none py-1"
                                            />
                                            <input
                                                value={exp.tarih || ""}
                                                onChange={(e) => handleArrayChange('deneyim', i, 'tarih', e.target.value)}
                                                placeholder="Tarih"
                                                className="bg-transparent border-b border-white/10 focus:border-accent text-sm text-white/60 w-1/2 outline-none py-1"
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        value={exp.aciklama || ""}
                                        onChange={(e) => handleArrayChange('deneyim', i, 'aciklama', e.target.value)}
                                        placeholder="Açıklama"
                                        className="bg-black/20 w-full rounded border border-white/5 p-2 text-sm text-white/80 outline-none focus:border-white/20 min-h-[60px]"
                                    />
                                </div>
                            ))}

                            <button
                                onClick={() => addItem('deneyim', { pozisyon: "", sirket: "", tarih: "", aciklama: "" })}
                                className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Yeni İş Deneyimi Ekle
                            </button>
                        </div>
                    </GlassCard>

                    {/* EĞİTİM */}
                    <GlassCard className="p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-accent">#</span> Eğitim
                        </h3>

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(formData.egitim_bilgileri || []).map((edu: any, i: number) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-accent/40 transition-colors relative group">
                                        <button
                                            onClick={() => removeItem('egitim_bilgileri', i)}
                                            className="absolute right-2 top-2 text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Sil
                                        </button>

                                        <input
                                            value={edu.okul || ""}
                                            onChange={(e) => handleArrayChange('egitim_bilgileri', i, 'okul', e.target.value)}
                                            placeholder="Okul Adı"
                                            className="bg-transparent border-b border-white/10 focus:border-accent font-semibold text-white w-full outline-none py-1 mb-2"
                                        />
                                        <input
                                            value={edu.bolum || ""}
                                            onChange={(e) => handleArrayChange('egitim_bilgileri', i, 'bolum', e.target.value)}
                                            placeholder="Bölüm"
                                            className="bg-transparent border-b border-white/10 focus:border-accent text-accent text-sm w-full outline-none py-1 mb-1"
                                        />
                                        <input
                                            value={edu.tarih || ""}
                                            onChange={(e) => handleArrayChange('egitim_bilgileri', i, 'tarih', e.target.value)}
                                            placeholder="Tarih"
                                            className="bg-transparent border-b border-white/10 focus:border-accent text-white/40 text-xs w-full outline-none py-1"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => addItem('egitim_bilgileri', { okul: "", bolum: "", tarih: "" })}
                                className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Yeni Eğitim Ekle
                            </button>
                        </div>
                    </GlassCard>

                    {/* PROJELER & SERTİFİKALAR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Projeler</h3>
                            <div className="space-y-4">
                                {(formData.projeler || []).map((proj: any, i: number) => (
                                    <div key={i} className="bg-black/20 p-3 rounded border border-white/5 relative group">
                                        <button
                                            onClick={() => removeItem('projeler', i)}
                                            className="absolute right-2 top-2 text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Sil
                                        </button>

                                        <input
                                            value={proj.isim || proj.name || ""}
                                            onChange={(e) => handleArrayChange('projeler', i, 'isim', e.target.value)}
                                            placeholder="Proje Adı"
                                            className="bg-transparent border-b border-white/10 focus:border-accent font-medium text-white text-sm w-full outline-none py-1 mb-2"
                                        />
                                        <textarea
                                            value={proj.aciklama || proj.description || ""}
                                            onChange={(e) => handleArrayChange('projeler', i, 'aciklama', e.target.value)}
                                            placeholder="Proje Açıklaması"
                                            className="bg-transparent w-full text-xs text-white/50 outline-none focus:text-white/80 resize-none h-16 border-b border-white/5 focus:border-accent"
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => addItem('projeler', { isim: "", aciklama: "" })}
                                    className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-xs text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                                >
                                    + Proje Ekle
                                </button>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Sertifikalar</h3>
                            <div className="space-y-2">
                                <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Düzenle (Virgülle)</label>
                                <textarea
                                    name="sertifikalar"
                                    value={formData.sertifikalar}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-md p-3 text-sm text-white focus:border-accent outline-none min-h-[150px]"
                                    placeholder="Sertifikalarınızı buraya yazabilirsiniz..."
                                />
                            </div>
                        </GlassCard>
                    </div>

                </div>
            </div>
        </div>
    );
}

function InputField({ label, name, value, onChange, placeholder }: any) {
    return (
        <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder || "Belirtilmemiş"}
                className="w-full bg-black/20 border border-white/10 rounded-md p-3 text-sm text-white focus:border-accent outline-none transition-all focus:bg-black/40"
            />
        </div>
    );
}
