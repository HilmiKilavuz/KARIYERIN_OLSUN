/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Backend'den gelecek sahte SkillMap verisinin tip tanımı
type AnalysisResult = any;

// State'imizin durumlarını daha net tanımlayalım
type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

interface AnalysisState {
  status: AnalysisStatus;
  analysisResult: AnalysisResult | null;
  error: string | null;

  // Eylemler (Actions)
  uploadCV: (file: File) => Promise<void>;
  fetchAnalysis: (profileId: number) => Promise<void>;
  reset: () => void;
}

// API'mizin ana adresi
const API_URL = 'http://localhost:4000/api';

export const useAnalysisStore = create<AnalysisState>((set) => ({
  status: 'idle',
  analysisResult: null,
  error: null,

  /**
   * 1. ADIM: CV Dosyasını Backend'e Yükler
   */
  uploadCV: async (file) => {
    set({ status: 'uploading', error: null });

    const formData = new FormData();
    formData.append('cvFile', file);

    try {
      const response = await axios.post(`${API_URL}/upload-cv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const rawData = response.data.data;

      // Transform raw data to graph data for SkillMap
      const skills = rawData.parsed_data?.yetenekler || [];
      const candidateName = rawData.parsed_data?.ad_soyad || "Aday";

      const nodes = [
        { id: "me", name: candidateName, level: 8 },
        ...skills.map((skill: string) => ({ id: skill, name: skill, level: 4 }))
      ];

      const links = skills.map((skill: string) => ({ source: "me", target: skill }));

      const graphData = { nodes, links, raw: rawData };

      toast.success("CV başarıyla analiz edildi!");
      set({ status: 'success', analysisResult: graphData });

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Yükleme başarısız oldu.';
      toast.error(errorMessage);
      set({ status: 'error', error: errorMessage });
    }
  },

  /**
   * 2. ADIM: Mevcut Analizi Çeker
   */
  /**
   * 2. ADIM: Mevcut Analizi Çeker
   */
  fetchAnalysis: async (userId: number) => {
    set({ status: 'analyzing', error: null });
    try {
      // Backend: /auth/analysis/:userId endpointi
      const response = await axios.get(`${API_URL}/auth/analysis/${userId}`);

      // Response structure: { success: true, analysis: { ... } }
      const analysisData = response.data.analysis;

      if (!analysisData) {
        set({ status: 'idle', analysisResult: null });
        return;
      }

      // Backend'den gelen 'analiz_sonuclari' tablosundaki 'report_text' veya başka alanları parse edebiliriz.
      // Ancak şu an graph için 'aday_profil' verisine ihtiyacımız olabilir veya
      // analiz sonucunda 'extracted_skills' varsa onu kullanabiliriz.
      // Şimdilik 'overall_score' ve 'core_score' gibi verileri kullanacağız.

      // Since `analiz_sonuclari` doesn't strictly have the skills list (unless stored in report_text or unrelated col),
      // we might want to display the Score instead of skills graph, OR we assume skills are passed.
      // For now, let's look at `candidate_data`. 

      // Actually, let's fetch profile separately if needed, but for now let's map what we have.
      // If `analysisData` contains score, let's build a graph around it?
      // Or better: The user wants "analysis map" based on database results.

      // Let's create a node for "Overall Score" and "Core Score".
      const nodes = [
        { id: "score_center", name: `Skor: ${analysisData.overall_score || '?'}`, level: 10, group: 'score' },
        ...(analysisData.core_score ? [{ id: "core_score", name: `Çekirdek: ${analysisData.core_score}`, level: 6, group: 'score' }] : []),
        { id: "role", name: analysisData.detected_role || "Rol Belirsiz", level: 8, group: 'role' },
        // Add status node
        { id: "status", name: analysisData.status === 'completed' ? "Tamamlandı" : "İşleniyor", level: 5, group: 'status' }
      ];

      const links = [
        { source: "score_center", target: "role" },
        ...(analysisData.core_score ? [{ source: "score_center", target: "core_score" }] : []),
        { source: "role", target: "status" }
      ];

      // If we could grab skills from the profile, we would add them here. 
      // But `analiz_sonuclari` table doesn't have skills column in the schema I saw in `supabase_cv_fetcher.py`.
      // It reads from `aday_profil`. Ideally we should fetch `aday_profil` skills too.
      // For this iterations, let's show the Score/Role graph first as requested ("analiz sonuçları kısmına göre").

      const graphData = { nodes, links, raw: analysisData };

      set({ status: 'success', analysisResult: graphData });
      toast.success('Analiz verileri yüklendi.');

    } catch (err: any) {
      console.error("Fetch analysis error:", err);
      // Don't show error toast if it's just 404/no data, just set idle
      set({ status: 'idle', error: null });
    }
  },

  /**
   * Durumu sıfırlar
   */
  reset: () => set({ status: 'idle', analysisResult: null, error: null }),
}));
