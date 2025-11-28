import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Volume2, VolumeX, Power, Send, Loader, AlertTriangle, Camera, CameraOff } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const API_URL = 'http://localhost:3001/api';

export default function App() {
  const [streamId, setStreamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [message, setMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [voiceId, setVoiceId] = useState('tr-TR-AhmetNeural');
  const [logs, setLogs] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [userStream, setUserStream] = useState(null);

  const videoRef = useRef(null);
  const userVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev.slice(-4), { text, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    setMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (streamId) disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    return () => {
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
        setUserStream(null);
      }
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      addLog('Kamera kapatıldı', 'info');
    } else {
      try {
        addLog('Kamera açılıyor...', 'info');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        setUserStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        addLog('Kamera açıldı', 'success');
      } catch (error) {
        console.error('Kamera erişim hatası:', error);
        addLog(`Kamera hatası: ${error.message}`, 'error');
      }
    }
  };

  const connectToAvatar = async () => {
    setIsLoading(true);
    addLog('Avatar\'a bağlanılıyor...', 'info');

    try {
      const createResponse = await fetch(`${API_URL}/streams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg'
        })
      });

      const createData = await createResponse.json();
      if (!createData.success) throw new Error(createData.error);

      setStreamId(createData.streamId);
      setSessionId(createData.sessionId);
      addLog(`Stream oluşturuldu: ${createData.streamId}`, 'success');

      const peerConnection = new RTCPeerConnection({
        iceServers: createData.iceServers
      });

      peerConnectionRef.current = peerConnection;

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch(`${API_URL}/streams/${createData.streamId}/ice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              sessionId: createData.sessionId
            })
          });
        }
      };

      peerConnection.ontrack = (event) => {
        addLog('Video akışı alındı', 'success');
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onconnectionstatechange = () => {
        addLog(`Bağlantı durumu: ${peerConnection.connectionState}`, 'info');
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
        } else if (peerConnection.connectionState === 'disconnected' ||
          peerConnection.connectionState === 'failed') {
          setIsConnected(false);
        }
      };

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(createData.offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const startResponse = await fetch(`${API_URL}/streams/${createData.streamId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answer,
          sessionId: createData.sessionId
        })
      });

      const startData = await startResponse.json();
      if (!startData.success) throw new Error(startData.error);

      addLog('WebRTC bağlantısı kuruldu!', 'success');
      setIsConnected(true);

    } catch (error) {
      console.error('Bağlantı hatası:', error);
      addLog(`Hata: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const speakToAvatar = async () => {
    if (!message.trim() || !streamId || isTalking) return;

    setIsTalking(true);
    addLog(`Konuşuluyor: "${message}"`, 'info');

    if (listening) {
      SpeechRecognition.stopListening();
    }

    try {
      const response = await fetch(`${API_URL}/streams/${streamId}/talk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          voiceId: voiceId,
          sessionId: sessionId
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      addLog('Konuşma başlatıldı', 'success');
      setMessage('');
      resetTranscript();

      setTimeout(() => setIsTalking(false), 5000);

    } catch (error) {
      console.error('Konuşma hatası:', error);
      addLog(`Hata: ${error.message}`, 'error');
      setIsTalking(false);
    }
  };

  const disconnect = async () => {
    if (!streamId) return;

    addLog('Bağlantı kapatılıyor...', 'info');

    try {
      if (listening) {
        SpeechRecognition.stopListening();
      }

      await fetch(`${API_URL}/streams/${streamId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setStreamId(null);
      setSessionId(null);
      setIsConnected(false);
      addLog('Bağlantı kapatıldı', 'success');

    } catch (error) {
      console.error('Kapatma hatası:', error);
      addLog(`Hata: ${error.message}`, 'error');
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 flex items-center justify-center">
        <div className="bg-red-500/20 text-red-200 p-6 rounded-lg text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Tarayıcı Desteklenmiyor</h2>
          <p>Bu tarayıcı ses tanımayı desteklemiyor. Lütfen Chrome veya Edge kullanın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">
            🤖 D-ID AI Avatar
          </h1>
          <p className="text-purple-200 text-lg">
            Yapay Zeka destekli sanal avatar ile görüntülü konuşun
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
                <div className="p-3 border-b border-purple-500/30">
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4" />
                    AI Avatar
                  </h3>
                </div>
                <div className="relative aspect-video bg-gray-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />

                  {!isConnected && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center p-4">
                        <Video className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                        <p className="text-white text-sm mb-3">Avatar hazır değil</p>
                        <button
                          onClick={connectToAvatar}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                        >
                          Bağlan
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center">
                        <Loader className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-spin" />
                        <p className="text-white text-sm">Bağlanıyor...</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-2">
                    {isConnected && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        Bağlı
                      </span>
                    )}
                    {isTalking && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
                        Konuşuyor...
                      </span>
                    )}
                  </div>

                  {isConnected && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                        title="Ses Aç/Kapat"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={disconnect}
                        className="p-2 bg-red-600/80 hover:bg-red-700 text-white rounded-full transition"
                        title="Bağlantıyı Kes"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
                <div className="p-3 border-b border-purple-500/30 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    <Camera className="w-4 h-4" />
                    Sizin Kameranız
                  </h3>
                  <button
                    onClick={toggleCamera}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${isCameraOn
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                  >
                    {isCameraOn ? (
                      <>
                        <CameraOff className="w-3 h-3" />
                        Kapat
                      </>
                    ) : (
                      <>
                        <Camera className="w-3 h-3" />
                        Aç
                      </>
                    )}
                  </button>
                </div>

                <div className="relative aspect-video bg-gray-900">
                  <video
                    ref={userVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />

                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center">
                        <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Kamera kapalı</p>
                      </div>
                    </div>
                  )}

                  {isCameraOn && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        Açık
                      </span>
                    </div>
                  )}

                  {listening && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full animate-pulse">
                        Dinliyor...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isConnected && (
              <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <div className="flex gap-3">
                  <button
                    onClick={() => SpeechRecognition.startListening({ continuous: true, language: 'tr-TR' })}
                    disabled={listening}
                    title="Mikrofonu Aç"
                    className={`p-3 rounded-lg font-semibold transition ${listening ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={SpeechRecognition.stopListening}
                    disabled={!listening}
                    title="Mikrofonu Kapat"
                    className={`p-3 rounded-lg font-semibold transition ${!listening ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  >
                    <MicOff className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && speakToAvatar()}
                    placeholder={listening ? "Dinliyorum..." : "Konuşun veya buraya yazın..."}
                    className="flex-1 px-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!isConnected}
                  />

                  <button
                    onClick={() => {
                      if (listening) {
                        SpeechRecognition.stopListening();
                      }
                      speakToAvatar();
                    }}
                    disabled={!message.trim() || isTalking}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Gönder
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        addLog('Mülakat başlatılıyor...', 'info');
                        const response = await fetch(`${API_URL}/streams/${streamId}/start-interview`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ voiceId })
                        });
                        const data = await response.json();
                        if (data.success) {
                          addLog('Mülakat başladı!', 'success');
                        } else {
                          throw new Error(data.error);
                        }
                      } catch (e) {
                        addLog(`Hata: ${e.message}`, 'error');
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition flex items-center gap-2"
                  >
                    🎤 Başlat
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Ses Seçimi
              </h3>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="tr-TR-AhmetNeural">Ahmet (Erkek - TR)</option>
                <option value="tr-TR-EmelNeural">Emel (Kadın - TR)</option>
                <option value="en-US-JennyNeural">Jenny (Kadın - EN)</option>
                <option value="en-US-GuyNeural">Guy (Erkek - EN)</option>
              </select>
            </div>

            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-white font-semibold mb-4">Hızlı Komutlar</h3>
              <div className="space-y-2">
                {['Merhaba, nasılsın?', 'Kendini tanıtır mısın?', 'Bugün hava nasıl?'].map((text) => (
                  <button
                    key={text}
                    onClick={() => {
                      setMessage(text);
                      if (listening) SpeechRecognition.stopListening();
                      setTimeout(() => speakToAvatar(), 50);
                    }}
                    disabled={!isConnected || isTalking}
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-white font-semibold mb-4">Sistem Logları</h3>
              <div className="space-y-2 text-sm">
                {logs.map((log, i) => (
                  <div key={i} className={`p-2 rounded ${log.type === 'error' ? 'bg-red-500/20 text-red-200' :
                    log.type === 'success' ? 'bg-green-500/20 text-green-200' :
                      'bg-blue-500/20 text-blue-200'
                    }`}>
                    <span className="text-xs opacity-60">{log.time}</span> {log.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
