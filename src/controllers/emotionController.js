import axios from 'axios';

const EMOTION_SERVICE_URL = process.env.EMOTION_SERVICE_URL || 'https://kariyerin-olsun-797691657166.europe-west1.run.app';

const apiClient = axios.create({
    baseURL: EMOTION_SERVICE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
});

// Frame analizi
export const analyzeFrame = async (req, res) => {
    try {
        const { image, session_id } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image required' });
        }

        const response = await apiClient.post('/analyze-frame', {
            image,
            session_id: session_id || 'default'
        });

        res.json(response.data);
    } catch (error) {
        console.error('Emotion frame analysis error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Soru kaydı
export const recordQuestion = async (req, res) => {
    try {
        const { session_id, question_number, question, answer } = req.body;

        const response = await apiClient.post('/record-question', {
            session_id,
            question_number,
            question,
            answer
        });

        res.json(response.data);
    } catch (error) {
        console.error('Record question error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Session istatistikleri
export const getSessionStats = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const response = await apiClient.get(`/session-stats/${sessionId}`);
        res.json(response.data);
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Session not found' });
        }
        console.error('Session stats error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Mülakat kaydet
export const saveInterview = async (req, res) => {
    try {
        const { session_id, user_id, duration_seconds } = req.body;

        const response = await apiClient.post('/save-interview', {
            session_id,
            user_id,
            duration_seconds
        });

        res.json(response.data);
    } catch (error) {
        console.error('Save interview error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Session sıfırla
export const resetSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const response = await apiClient.post(`/reset-session/${sessionId}`);
        res.json(response.data);
    } catch (error) {
        console.error('Reset session error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Health check
export const healthCheck = async (req, res) => {
    try {
        const response = await apiClient.get('/health');
        res.json(response.data);
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Emotion service unavailable',
            error: error.message
        });
    }
};
