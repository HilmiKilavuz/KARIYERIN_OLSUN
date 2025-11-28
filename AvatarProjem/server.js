require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { StreamsApi, Configuration } = require('@d-id/node-sdk');
const axios = require('axios');
const { OpenAI } = require('openai');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// D-ID Configuration
const D_ID_API_KEY = process.env.D_ID_API_KEY;
if (!D_ID_API_KEY || !D_ID_API_KEY.includes(':')) {
  console.error("HATA: D_ID_API_KEY formatı yanlış veya eksik.");
  process.exit(1);
}

const keyParts = D_ID_API_KEY.split(':');
const D_ID_USERNAME = keyParts[0];
const D_ID_PASSWORD = keyParts[1];

const apiConfig = new Configuration({
  username: D_ID_USERNAME,
  password: D_ID_PASSWORD
});

const streamsApi = new StreamsApi(apiConfig);
const authToken = Buffer.from(`${D_ID_USERNAME}:${D_ID_PASSWORD}`).toString('base64');

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("HATA: OPENAI_API_KEY eksik.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Stream durumlarını tutmak için
const activeStreams = new Map();

// Mülakat ayarları - Şimdilik 3 soru
const TOTAL_INTERVIEW_QUESTIONS = 3;

// 1. Stream Oluşturma
app.post('/api/streams/create', async (req, res) => {
  try {
    const { sourceUrl } = req.body;

    const requestBody = {
      source_url: sourceUrl || "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg"
    };

    const response = await streamsApi.createStream(requestBody, {});
    const { id: streamId, offer, ice_servers: iceServers, session_id: sessionId } = response.data;

    activeStreams.set(streamId, {
      streamId,
      sessionId,
      createdAt: new Date(),
      interviewStep: -1,
      answers: [],
      conversationHistory: []
    });

    res.json({
      success: true,
      streamId,
      sessionId,
      offer,
      iceServers
    });

  } catch (error) {
    console.error('❌ Stream oluşturma hatası:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// 2. SDP Answer Gönderme
app.post('/api/streams/:streamId/start', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { answer, sessionId } = req.body;

    await axios.post(
      `https://api.d-id.com/talks/streams/${streamId}/sdp`,
      { answer: answer, session_id: sessionId },
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('❌ SDP başlatma hatası:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// 3. Avatarı Konuşturma
app.post('/api/streams/:streamId/talk', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { text: userInput, sessionId, voiceId } = req.body;

    const streamData = activeStreams.get(streamId);
    if (!streamData) {
      return res.status(404).json({ success: false, error: 'Stream bulunamadı' });
    }

    let aiResponseText = "";

    if (streamData.interviewStep !== undefined && streamData.interviewStep !== -1) {
      streamData.answers.push({
        questionNumber: streamData.interviewStep + 1,
        answer: userInput
      });

      streamData.conversationHistory.push({ role: "user", content: userInput });
      streamData.interviewStep++;

      if (streamData.interviewStep >= TOTAL_INTERVIEW_QUESTIONS) {
        aiResponseText = "Harika, tüm soruları cevapladınız. Mülakatımız sona erdi. Katılımınız için teşekkürler, size en kısa sürede dönüş yapacağız.";
        streamData.interviewStep = -1;
        streamData.conversationHistory = [];
      } else {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Sen profesyonel bir İnsan Kaynakları uzmanısın ve iş mülakatı yapıyorsun. 
              Toplam ${TOTAL_INTERVIEW_QUESTIONS} soru soracaksın. 
              Şu an ${streamData.interviewStep + 1}. soruyu sorma sırası. 
              Adayın önceki cevabına kısa (1 cümle) teşekkür et veya yorum yap, ardından yeni ve özgün bir mülakat sorusu sor. 
              Her seferinde FARKLI bir soru sor. Standart sorular kullanma, yaratıcı ol.`
            },
            ...streamData.conversationHistory
          ],
          max_tokens: 150,
          temperature: 0.9,
        });

        aiResponseText = completion.choices[0].message.content.trim();
        streamData.conversationHistory.push({ role: "assistant", content: aiResponseText });
      }

    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Sen D-ID tarafından canlandırılan yardımsever bir yapay zeka asistanısın. Cevapların kısa, net ve samimi olsun." },
          { role: "user", content: userInput }
        ],
        max_tokens: 70,
        temperature: 0.7,
      });

      aiResponseText = completion.choices[0].message.content.trim();
    }

    console.log('🤖 AI Cevabı:', aiResponseText);

    const talkRequest = {
      script: {
        type: 'text',
        input: aiResponseText,
        provider: { type: 'microsoft', voice_id: voiceId || 'tr-TR-AhmetNeural' }
      },
      config: {
        fluent: true,
        pad_audio: 0,
        driver_expressions: {
          expressions: [{ expression: 'neutral', start_frame: 0, intensity: 1.0 }],
          transition_frames: 0
        },
        align_driver: true,
        align_expand_factor: 0.3,
        auto_match: true,
        motion_factor: 0.8,
        normalization_factor: 0.2,
        sharpen: true,
        stitch: true,
        result_format: 'mp4'
      },
      session_id: sessionId
    };

    await axios.post(
      `https://api.d-id.com/talks/streams/${streamId}`,
      talkRequest,
      { headers: { 'Authorization': `Basic ${authToken}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, message: aiResponseText });

  } catch (error) {
    console.error('❌ Konuşma hatası:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// 4. Mülakatı Başlat
app.post('/api/streams/:streamId/start-interview', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { voiceId } = req.body;

    const streamData = activeStreams.get(streamId);
    if (!streamData) {
      return res.status(404).json({ success: false, error: 'Stream bulunamadı' });
    }

    streamData.interviewStep = 0;
    streamData.answers = [];
    streamData.conversationHistory = [];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen profesyonel bir İnsan Kaynakları uzmanısın ve iş mülakatı başlatıyorsun. 
          Toplam ${TOTAL_INTERVIEW_QUESTIONS} soru soracaksın.
          Adaya kısa bir hoş geldiniz mesajı ver (1-2 cümle) ve ilk mülakat sorusunu sor.`
        },
        { role: "user", content: "Merhaba, mülakata hazırım." }
      ],
      max_tokens: 150,
      temperature: 0.9,
    });

    const introText = completion.choices[0].message.content.trim();
    streamData.conversationHistory.push({ role: "assistant", content: introText });

    console.log('🎤 Mülakat Başlatıldı:', introText);

    const talkRequest = {
      script: {
        type: 'text',
        input: introText,
        provider: { type: 'microsoft', voice_id: voiceId || 'tr-TR-AhmetNeural' }
      },
      config: {
        fluent: true,
        pad_audio: 0,
        driver_expressions: {
          expressions: [{ expression: 'neutral', start_frame: 0, intensity: 1.0 }],
          transition_frames: 0
        },
        align_driver: true,
        align_expand_factor: 0.3,
        auto_match: true,
        motion_factor: 0.8,
        normalization_factor: 0.2,
        sharpen: true,
        stitch: true,
        result_format: 'mp4'
      },
      session_id: streamData.sessionId
    };

    await axios.post(
      `https://api.d-id.com/talks/streams/${streamId}`,
      talkRequest,
      { headers: { 'Authorization': `Basic ${authToken}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, message: introText });

  } catch (error) {
    console.error('❌ Mülakat başlatma hatası:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// 5. Stream Sonlandırma
app.delete('/api/streams/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { sessionId } = req.body;

    console.log('🛑 Stream sonlandırılıyor:', streamId);

    const streamData = activeStreams.get(streamId);

    await axios.delete(
      `https://api.d-id.com/talks/streams/${streamId}`,
      {
        headers: { 'Authorization': `Basic ${authToken}`, 'Content-Type': 'application/json' },
        data: { session_id: sessionId || streamData?.sessionId }
      }
    );

    activeStreams.delete(streamId);
    console.log('✅ Stream sonlandırıldı');

    res.json({ success: true, message: 'Stream sonlandırıldı' });

  } catch (error) {
    console.error('❌ Stream sonlandırma hatası:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// 6. ICE candidate ekle
app.post('/api/streams/:streamId/ice', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { candidate, sdpMLineIndex, sdpMid, sessionId } = req.body;

    await axios.post(
      `https://api.d-id.com/talks/streams/${streamId}/ice`,
      { candidate, sdpMLineIndex, sdpMid, session_id: sessionId },
      { headers: { 'Authorization': `Basic ${authToken}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('❌ ICE candidate hatası:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeStreams: activeStreams.size,
    timestamp: new Date().toISOString()
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Avatar Backend sunucusu çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Sunucu kapatılıyor...');

  for (const [streamId, streamData] of activeStreams.entries()) {
    try {
      await streamsApi.deleteStream(streamId, { session_id: streamData.sessionId }, {});
      console.log(`✅ Stream kapatıldı: ${streamId}`);
    } catch (error) {
      console.error(`⚠️ Stream kapatma hatası: ${streamId}`, error.message);
    }
  }

  process.exit(0);
});
