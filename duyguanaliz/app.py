import streamlit as st
import cv2
import mediapipe as mp
from deepface import DeepFace
import pandas as pd
import av
import numpy as np
from streamlit_webrtc import webrtc_streamer, VideoProcessorBase, WebRtcMode
from openai import OpenAI
import os
from dotenv import load_dotenv
import threading
import queue
import time
import matplotlib.pyplot as plt  # Grafik için gerekli kütüphane

# 1. Ayarlar
load_dotenv()
st.set_page_config(page_title="Canlı Mülakat Pro", layout="wide")

# --- MODELLER ---
@st.cache_resource
def load_models():
    mp_face_mesh = mp.solutions.face_mesh
    return mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

face_mesh = load_models()
TOP_LID, BOTTOM_LID = 159, 145
SORULAR = ["1. Kendinizden bahsedin?", "2. Güçlü yönleriniz neler?", "3. Neden biz?"]

# --- ORTAK HAFIZA ---
@st.cache_resource
def get_global_state():
    return {
        "lock": threading.Lock(),
        "data": {
            "blink": 0,
            "current_emo": "Nötr",
            "emo_history": [] 
        }
    }

state_container = get_global_state()
lock = state_container["lock"]
shared_state = state_container["data"]

# Session State Başlatma
if 'soru_index' not in st.session_state: st.session_state.soru_index = 0
if 'gecmis' not in st.session_state: st.session_state.gecmis = []

# --- OPTİMİZE EDİLMİŞ VİDEO İŞLEMCİSİ ---
class VideoProcessor(VideoProcessorBase):
    def __init__(self):
        self.frame_counter = 0
        self.eye_closed = False
        self.last_frame_roi = None
        self.keep_running = True
        
        self.analysis_thread = threading.Thread(target=self.analyze_loop, daemon=True)
        self.analysis_thread.start()

    def analyze_loop(self):
        global shared_state, lock
        while self.keep_running:
            if self.last_frame_roi is not None:
                roi = self.last_frame_roi
                self.last_frame_roi = None
                try:
                    obj = DeepFace.analyze(roi, actions=['emotion'], enforce_detection=False, silent=True)
                    emotions = obj[0]['emotion']
                    
                    aday_duygu = "neutral"
                    max_score = 0
                    for emo_name, score in emotions.items():
                        if emo_name == "neutral": continue
                        if score > max_score:
                            max_score = score
                            aday_duygu = emo_name
                    
                    final_emo = aday_duygu if max_score > 10 else "neutral"
                    tr_emo = {'happy':'Mutlu','sad':'Gergin','fear':'Gergin','neutral':'Nötr', 
                              'angry': 'Kızgın', 'surprise': 'Şaşkın', 'disgust': 'İğrenme'}.get(final_emo, final_emo)
                    
                    with lock:
                        shared_state["current_emo"] = tr_emo
                        shared_state["emo_history"].append(tr_emo)
                except Exception:
                    pass
            else:
                time.sleep(0.1)

    def recv(self, frame):
        img = frame.to_ndarray(format="bgr24")
        img = cv2.flip(img, 1)
        h, w, _ = img.shape
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        global shared_state, lock
        results = face_mesh.process(rgb)
        
        if results.multi_face_landmarks:
            for landmarks in results.multi_face_landmarks:
                # Göz Kırpma
                top = int(landmarks.landmark[TOP_LID].y * h)
                bottom = int(landmarks.landmark[BOTTOM_LID].y * h)
                
                if abs(bottom - top) < 5:
                    if not self.eye_closed:
                        with lock:
                            shared_state["blink"] += 1
                        self.eye_closed = True
                else:
                    self.eye_closed = False
                
                # --- İSTEĞE BAĞLI: YÜZ ÇERÇEVESİNİ DE KALDIRMAK İSTERSEN BU BLOĞU SİL ---
                # Çizim ve ROI
                x_min = int(landmarks.landmark[234].x * w)
                x_max = int(landmarks.landmark[454].x * w)
                y_min = int(landmarks.landmark[10].y * h)
                y_max = int(landmarks.landmark[152].y * h)

                padding_w = int((x_max - x_min) * 0.2)
                padding_h = int((y_max - y_min) * 0.2)

                x_min = max(0, x_min - padding_w)
                x_max = min(w, x_max + padding_w)
                y_min = max(0, y_min - padding_h)
                y_max = min(h, y_max + padding_h)

                # Yeşil kutuyu çiziyoruz (Yüzünü algıladığımızı anlaması için kalabilir)
                cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
                # ---------------------------------------------------------------------
                
                self.frame_counter += 1
                if self.frame_counter % 5 == 0:
                    roi = img[y_min:y_max, x_min:x_max]
                    if roi.size > 0:
                        self.last_frame_roi = roi.copy()

        # --- BURASI DEĞİŞTİ ---
        # Ekrana yazı yazdırma kısımlarını kaldırdık.
        # Böylece kullanıcı sadece kendi yüzünü (ayna gibi) görecek.
        # Ama shared_state arka planda hala veriyi topluyor.
        
        # cv2.putText(img, f"Duygu: {curr_emo}", (20, 50)...  <-- SİLİNDİ
        # cv2.putText(img, f"Goz: {curr_blink}", (20, 90)...  <-- SİLİNDİ

        return av.VideoFrame.from_ndarray(img, format="bgr24")

# --- AI PUANLAMA ---
def puanla(soru, cevap, key):
    if not key: return "Key Yok"
    try:
        client = OpenAI(api_key=key)
        
        # 1. System Prompt: AI'ya "Geveze olma" emrini burada veriyoruz
        system_prompt = """
        Sen sadece veri analizi yapan bir algoritmasın. 
        Sohbet etme, giriş/gelişme/sonuç cümlesi kurma, övgü veya nezaket ifadeleri kullanma.
        Sadece istenen formatta, en kısa ve vurucu ifadelerle çıktı ver.
        """
        
        # 2. User Prompt: Formatı zorluyoruz (Bullet points ve kelime sınırı)
        user_prompt = f"""
        Soru: {soru}
        Cevap: {cevap}

        Lütfen cevabı şu formatta analiz et (Her madde maksimum 10 kelime olsun):
        
        PUAN: [0-10 arası sayı]/10
        DURUM: [Tek kelime: Yetersiz / Geliştirilmeli / İyi / Mükemmel]
        EKSİK: [Cevapta ne yok? Net ve sert ol]
        ÖNERİ: [Ne yapmalı? Emir kipi kullan]
        """

        res = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3 # Yaratıcılığı kıstık, daha tutarlı olsun diye
        )
        return res.choices[0].message.content
    except Exception as e: return str(e)
# --- ARAYÜZ ---
st.title("📹 Gerçek Zamanlı Analizli Mülakat")

with st.sidebar:
    st.header("Ayarlar")
    env_key = os.getenv("OPENAI_API_KEY")
    api_key = env_key if env_key else st.text_input("API Key", type="password")
    
    if st.button("Sıfırla"):
        with lock:
            shared_state["blink"] = 0
            shared_state["emo_history"] = []
            shared_state["current_emo"] = "Nötr"
        st.session_state.clear()
        st.rerun()

if st.session_state.soru_index < len(SORULAR):
    soru = SORULAR[st.session_state.soru_index]
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.info("Kameranızı başlatmak için **START** butonuna basın.")
        webrtc_streamer(
            key="interview",
            mode=WebRtcMode.SENDRECV,
            video_processor_factory=VideoProcessor,
            media_stream_constraints={"video": True, "audio": False},
            async_processing=True,
        )

    with col2:
        st.subheader(f"❓ {soru}")
        with st.form("cevap_form"):
            cevap = st.text_area("Cevabınız:", height=300)
            if st.form_submit_button("Cevabı Gönder"):
                if len(cevap) < 2:
                    st.warning("Lütfen cevap yazın.")
                else:
                    with lock:
                        final_blink = shared_state["blink"]
                        tum_duygular = list(shared_state["emo_history"])
                        shared_state["blink"] = 0
                        shared_state["emo_history"] = []
                        shared_state["current_emo"] = "Nötr"

                    duygular_filtreli = [d for d in tum_duygular if d != "Nötr"]
                    baskin_duygu = max(set(duygular_filtreli), key=duygular_filtreli.count) if duygular_filtreli else "Nötr"
                    
                    puan = "Key Yok"
                    if api_key:
                        with st.spinner("Puanlanıyor..."):
                            puan = puanla(soru, cevap, api_key)
                    
                    st.session_state.gecmis.append({
                        "Soru": soru, "Cevap": cevap, 
                        "Göz Kırpma": final_blink, "Baskın Duygu": baskin_duygu, "AI": puan
                    })
                    st.session_state.soru_index += 1
                    st.rerun()
else:
    st.balloons()
    st.header("📝 Mülakat Sonuç Raporu")
    
    df = pd.DataFrame(st.session_state.gecmis)
    st.table(df)
    
    if not df.empty:
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("👀 Stres Analizi (Göz Kırpma)")
            st.caption("Yüksek göz kırpma stresi işaret edebilir.")
            st.bar_chart(df.set_index("Soru")["Göz Kırpma"])
        
        with col2:
            st.subheader("😊 Duygu Dağılımı")
            st.caption("Mülakat genelinde hissedilen duygular.")
            
            # Pasta grafiği çizimi
            try:
                duygu_sayilari = df["Baskın Duygu"].value_counts()
                fig, ax = plt.subplots(figsize=(5, 5))
                ax.pie(duygu_sayilari, labels=duygu_sayilari.index, autopct='%1.1f%%', startangle=90, 
                       colors=['#66b3ff', '#ff9999', '#99ff99', '#ffcc99'])
                fig.patch.set_alpha(0) # Şeffaf arka plan
                st.pyplot(fig)
            except Exception as e:
                st.error("Grafik oluşturulamadı: Veri yetersiz olabilir.")

    st.markdown("---")
    if st.button("🔄 Yeni Mülakat Başlat", type="primary"):
        st.session_state.clear()
        st.rerun()