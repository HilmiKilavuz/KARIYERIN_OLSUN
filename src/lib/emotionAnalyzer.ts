// Emotion Analyzer Client - Tam özellikli arka plan analizi
// Göz kırpma + Duygu + Yüz algılama
const API_URL = "https://kariyerin-olsun-797691657166.europe-west1.run.app";

interface AnalysisResult {
    emotion: string;
    blinkCount: number;
    faceDetected: boolean;
}

type OnAnalysisCallback = (result: AnalysisResult) => void;

class EmotionAnalyzerClient {
    private sessionId: string = '';
    private intervalId: NodeJS.Timeout | null = null;
    private isAnalyzing = false;
    private lastEmotion = 'Nötr';
    private lastBlinkCount = 0;
    private onAnalysis?: OnAnalysisCallback;

    async checkHealth(): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/health`, { method: 'GET' });
            return res.ok;
        } catch {
            return false;
        }
    }

    start(video: HTMLVideoElement, onAnalysis: OnAnalysisCallback, intervalMs = 1000) {
        this.sessionId = `session_${Date.now()}`;
        this.onAnalysis = onAnalysis;

        console.log('🎭 Emotion analysis started, session:', this.sessionId);

        this.intervalId = setInterval(() => {
            if (!this.isAnalyzing && video.readyState >= 2) {
                this.analyzeFrame(video);
            }
        }, intervalMs);
    }

    private async analyzeFrame(video: HTMLVideoElement) {
        this.isAnalyzing = true;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                this.isAnalyzing = false;
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.7);

            const res = await fetch(`${API_URL}/analyze-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, session_id: this.sessionId })
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Emotion analysis result:', data.emotion);

                this.lastEmotion = data.emotion || 'Notr';
                this.lastBlinkCount = data.blink_count || 0;

                // Always call callback with latest data
                this.onAnalysis?.({
                    emotion: this.lastEmotion,
                    blinkCount: this.lastBlinkCount,
                    faceDetected: data.face_detected || false
                });
            } else {
                console.warn('Emotion analysis response not ok:', res.status);
            }
        } catch (e) {
            console.warn('Emotion analysis failed:', e);
        }

        this.isAnalyzing = false;
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('🎭 Emotion analysis stopped');
    }

    getSessionId() {
        return this.sessionId;
    }

    getLastEmotion() {
        return this.lastEmotion;
    }

    getBlinkCount() {
        return this.lastBlinkCount;
    }

    async scoreAnswer(question: string, answer: string): Promise<string> {
        try {
            const res = await fetch(`${API_URL}/score-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    question,
                    answer
                })
            });
            if (res.ok) {
                const data = await res.json();
                return data.score || '';
            }
            return '';
        } catch {
            return '';
        }
    }

    async saveInterview(userId: number, durationSeconds: number): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/save-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    user_id: userId,
                    duration_seconds: durationSeconds
                })
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async reset() {
        this.stop();
        if (this.sessionId) {
            try {
                await fetch(`${API_URL}/reset-session/${this.sessionId}`, { method: 'POST' });
            } catch { }
        }
        this.sessionId = '';
        this.lastEmotion = 'Nötr';
        this.lastBlinkCount = 0;
    }
}

export const emotionAnalyzer = new EmotionAnalyzerClient();
export type { AnalysisResult };
