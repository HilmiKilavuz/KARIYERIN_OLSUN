"use client";

import React, { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { AvatarPlayer } from "@/components/AvatarPlayer";
import { emotionAnalyzer, AnalysisResult } from "@/lib/emotionAnalyzer";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:4000/api";

export default function SimulationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // --- STATE ---
  const [streamId, setStreamId] = useState<string | null>(null);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | undefined>(undefined);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visualsMocked, setVisualsMocked] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "connecting" | "ready" | "error">("idle");

  // Camera State
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Chat State
  const [messages, setMessages] = useState<{ id: string; role: "bot" | "user"; content: string }[]>([
    { id: "intro", role: "bot", content: "Merhaba! Mülakata başlamak için lütfen 'Bağlan' butonuna tıklayın." }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Emotion Analysis State
  const [currentEmotion, setCurrentEmotion] = useState("Notr");
  const [blinkCount, setBlinkCount] = useState(0);
  const [emotionServiceReady, setEmotionServiceReady] = useState(false);

  // Interview Results State
  interface InterviewAnswer {
    question: string;
    answer: string;
    dominantEmotion: string;
    aiScore: string;
  }
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswer[]>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<string[]>([]);
  const [isScoring, setIsScoring] = useState(false);

  // --- SPEECH RECOGNITION ---
  const createRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;  // Stop after speech ends
    recognition.interimResults = false;  // Only final results
    recognition.lang = 'tr-TR';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech recognized:', transcript);
      // Write to input field - user will send manually
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      // Ignore no-speech and aborted errors - they're expected in continuous mode
      if (event.error === 'no-speech' || event.error === 'aborted') {
        console.log('Speech recognition:', event.error, '(normal, continuing...)');
        return;
      }
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };
    recognition.onstart = () => {
      console.log('Speech recognition started successfully');
    };
    recognition.onspeechstart = () => {
      console.log('Speech detected');
    };
    recognition.onaudiostart = () => {
      console.log('Audio capture started');
    };

    return recognition;
  };

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    } else {
      const recognition = createRecognition();
      if (!recognition) {
        alert('Tarayıcınız ses tanıma desteklemiyor.');
        return;
      }

      try {
        console.log('Starting speech recognition...');
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (error: any) {
        console.error('Mikrofon hatası:', error);
        alert(`Mikrofon başlatılamadı: ${error.message}`);
      }
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    // Check emotion service health
    emotionAnalyzer.checkHealth().then(setEmotionServiceReady);
    return () => {
      stopCamera();
      emotionAnalyzer.reset();
    };
  }, []);

  // --- HANDLERS ---
  const handleAnswerCreated = async (answer: RTCSessionDescriptionInit) => {
    if (!streamId || !sessionId) return;
    try {
      await axios.post(`${API_BASE_URL}/streams/${streamId}/start`, {
        sdp: answer,
        session_id: sessionId
      });
      setAvatarStatus("ready");

      // Mülakat ilk /talk mesajında otomatik başlar
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: "Bağlantı kuruldu! Mülakata başlamak için bir mesaj gönderin."
      }]);
    } catch (error) {
      console.error("Start stream error", error);
      setAvatarStatus("error");
    }
  };

  const handleIceCandidate = (candidate: RTCIceCandidate) => {
    if (streamId && !visualsMocked && sessionId) {
      axios.post(`${API_BASE_URL}/streams/${streamId}/ice`, {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        session_id: sessionId
      }).catch(e => console.error("ICE error", e));
    }
  };

  const handleStreamReady = () => {
    setAvatarStatus("ready");
  };

  const startConnection = async () => {
    setAvatarStatus("connecting");
    console.log("🚀 Starting connection...");

    try {
      const res = await axios.post(`${API_BASE_URL}/streams/create`, { userId: user?.id });
      console.log("Stream response:", res.data);

      const { streamId: id, offer, sessionId: session_id, iceServers } = res.data;

      if (!id || !offer) {
        console.error("Missing streamId or offer!", res.data);
        setAvatarStatus("error");
        return;
      }

      setStreamId(id);
      setSessionId(session_id);
      setOffer(offer);
      setIceServers(iceServers || []);
      setVisualsMocked(!!res.data.visualsMocked);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: "Bağlantı kuruluyor..."
      }]);
    } catch (e) {
      console.error("Connection failed", e);
      setAvatarStatus("error");
    }
  };

  const endConnection = async () => {
    if (streamId && sessionId) {
      try {
        await axios.delete(`${API_BASE_URL}/streams/${streamId}`, {
          data: { session_id: sessionId }
        });
      } catch (e) {
        console.error("Delete error", e);
      }
    }

    setStreamId(null);
    setSessionId(null);
    setOffer(undefined);
    setIceServers([]);
    setAvatarStatus("idle");
    stopCamera();
  };

  const sendMessage = async () => {
    if (!input.trim() || !streamId || !sessionId) return;
    const text = input.trim();

    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: text }]);
    setInput("");

    // Track interview start time
    if (!interviewStartTime) {
      setInterviewStartTime(Date.now());
    }

    // Calculate dominant emotion from history (like app.py)
    if (currentQuestion && emotionHistory.length > 0) {
      const filtered = emotionHistory.filter(e => e !== "Notr");
      const dominantEmotion = filtered.length > 0
        ? filtered.sort((a, b) =>
          filtered.filter(v => v === a).length - filtered.filter(v => v === b).length
        ).pop() || "Notr"
        : "Notr";

      // Get AI scoring (like app.py puanla function)
      setIsScoring(true);
      let aiScore = "Puanlaniyor...";
      try {
        aiScore = await emotionAnalyzer.scoreAnswer(currentQuestion, text);
      } catch (e) {
        aiScore = "Puanlama hatasi";
      }
      setIsScoring(false);

      // Save answer with dominant emotion and AI score
      setInterviewAnswers(prev => [...prev, {
        question: currentQuestion,
        answer: text,
        dominantEmotion: dominantEmotion,
        aiScore: aiScore
      }]);

      // Reset emotion history for next question
      setEmotionHistory([]);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/streams/${streamId}/talk`, {
        text,
        session_id: sessionId
      });

      const botResponse = res.data.message || res.data.text || "Yanit alindi...";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "bot", content: botResponse }]);

      // Track the next question from bot
      setCurrentQuestion(botResponse);

      // Check if interview is complete (5 questions answered)
      if (res.data.interviewStep === -1 || interviewAnswers.length >= 4) {
        setInterviewComplete(true);
        // Save to database
        saveInterviewResults();
      }
    } catch (e) {
      console.error("Talk error", e);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "bot", content: "Bir hata olustu." }]);
    }
  };

  const saveInterviewResults = async () => {
    if (!user) return;
    const duration = interviewStartTime ? Math.floor((Date.now() - interviewStartTime) / 1000) : 0;
    try {
      await emotionAnalyzer.saveInterview(user.id, duration);
      console.log('Interview results saved to database');
    } catch (e) {
      console.error('Failed to save interview results:', e);
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;

          // Start emotion analysis after camera is ready
          setTimeout(() => {
            if (userVideoRef.current) {
              console.log('Starting emotion analysis...');
              emotionAnalyzer.start(userVideoRef.current, (result: AnalysisResult) => {
                console.log('Emotion updated:', result.emotion);
                setCurrentEmotion(result.emotion);
                setBlinkCount(result.blinkCount);
                // Add to emotion history for dominant emotion calculation
                setEmotionHistory(prev => [...prev, result.emotion]);
              }, 2000);
            }
          }, 1500);
        }
        setCameraOn(true);
      } catch (e) {
        console.error("Camera error", e);
        alert("Kamera açılamadı.");
      }
    }
  };

  const stopCamera = () => {
    emotionAnalyzer.stop();
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    if (userVideoRef.current) userVideoRef.current.srcObject = null;
    setCameraOn(false);
  };

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center text-accent">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-7xl h-[90vh] flex flex-col gap-4">

        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🎭 AI Mülakat Simülasyonu</h1>

          <div className="flex gap-3">
            <button
              onClick={toggleCamera}
              className={`px-4 py-2 rounded ${cameraOn ? 'bg-red-500' : 'bg-gray-600'} text-white`}
            >
              {cameraOn ? "Kamera Kapat" : "Kamera Aç"}
            </button>
            {!streamId && (
              <button onClick={startConnection} className="px-4 py-2 bg-green-500 text-white rounded">
                Bağlan
              </button>
            )}
            {streamId && (
              <button onClick={endConnection} className="px-4 py-2 bg-red-500 text-white rounded">
                Bağlantıyı Kes
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

          {/* LEFT: Avatar */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg overflow-hidden relative">
            {streamId ? (
              <AvatarPlayer
                streamId={streamId}
                sessionId={sessionId}
                offer={offer}
                iceServers={iceServers}
                visualsMocked={visualsMocked}
                onIceCandidate={handleIceCandidate}
                onStreamReady={handleStreamReady}
                onAnswerCreated={handleAnswerCreated}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50">
                <div className="text-center">
                  <p className="text-xl mb-4">Avatar Hazır</p>
                  <p className="text-sm">Bağlanmak için butona tıklayın</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Chat + Camera - Fixed height to match avatar */}
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            {/* User Camera with Emotion Indicator */}
            <div className={`h-[180px] bg-gray-800 rounded-lg overflow-hidden relative flex-shrink-0 ${cameraOn ? '' : 'hidden'}`}>
              <video
                ref={userVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {/* Emotion Indicator */}
              {cameraOn && (
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Duygu:</span>
                    <span className="text-sm font-medium text-green-400">{currentEmotion}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat - Takes remaining space with scroll */}
            <div className="bg-gray-900 rounded-lg p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
              <h3 className="text-white font-semibold mb-2 flex-shrink-0">Sohbet</h3>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8' : 'bg-gray-700 text-white mr-8'
                      }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Cevabınızı yazın..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded"
                />
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}
                  title={isListening ? 'Dinlemeyi durdur' : 'Sesli cevap ver'}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button data-send-btn onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Gönder
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Interview Results Modal */}
      {interviewComplete && interviewAnswers.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Mulakat Sonuclari
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300 table-fixed">
                <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                  <tr>
                    <th className="px-3 py-3 w-12">#</th>
                    <th className="px-3 py-3 w-1/4">Soru</th>
                    <th className="px-3 py-3 w-1/4">Cevap</th>
                    <th className="px-3 py-3 w-24">Baskin Duygu</th>
                    <th className="px-3 py-3 w-1/3">AI Puanlama</th>
                  </tr>
                </thead>
                <tbody>
                  {interviewAnswers.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 align-top">
                      <td className="px-3 py-4 font-medium text-white">{index + 1}</td>
                      <td className="px-3 py-4">
                        <div className="text-gray-300 text-sm break-words whitespace-pre-wrap">
                          {item.question}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-gray-300 text-sm break-words whitespace-pre-wrap">
                          {item.answer}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.dominantEmotion === 'Mutlu' ? 'bg-green-500/20 text-green-400' :
                          item.dominantEmotion === 'Gergin' || item.dominantEmotion === 'Uzgun' ? 'bg-red-500/20 text-red-400' :
                            item.dominantEmotion === 'Saskin' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                          }`}>
                          {item.dominantEmotion || 'Notr'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-xs text-gray-300 whitespace-pre-wrap break-words bg-black/30 p-2 rounded">
                          {item.aiScore || 'Puanlama bekleniyor...'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => {
                  setInterviewComplete(false);
                  setInterviewAnswers([]);
                  setMessages([{ id: "intro", role: "bot", content: "Merhaba! Yeni mulakata baslamak icin 'Baglan' butonuna tiklayin." }]);
                  setStreamId(null);
                  setSessionId(null);
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Yeni Mulakat
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Dashboard'a Don
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


