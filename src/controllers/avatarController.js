import * as avatarService from '../services/avatarService.js';

export const createStream = async (req, res) => {
    try {
        const { userId } = req.body;
        const data = await avatarService.createStream(userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const startStream = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Controller startStream body:", req.body);
        const { sdp, session_id } = req.body;
        const data = await avatarService.startStream(id, sdp, session_id);
        res.json(data);
    } catch (error) {
        console.error("Controller startStream error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const submitIceCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { candidate, sdpMid, sdpMLineIndex, session_id } = req.body;
        const data = await avatarService.submitIceCandidate(id, candidate, sdpMid, sdpMLineIndex, session_id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const talkToAvatar = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, session_id } = req.body;
        // Assuming talkToAvatar service also needs update, but let's stick to what we saw in server.js
        // server.js expects sessionId in body for talk endpoint too.
        // I need to update avatarService.js for talkToAvatar as well? 
        // Let's check server.js again. Yes: const { text: userInput, sessionId, voiceId } = req.body;
        // So I should update avatarService.js for talkToAvatar too.
        // For now, I will update controller to pass it, and then I will update service.
        const data = await avatarService.talkToAvatar(id, text, session_id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const startInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { session_id, userId } = req.body;
        const data = await avatarService.startInterview(id, session_id, userId);
        res.json(data);
    } catch (error) {
        console.error("startInterview error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

export const deleteStream = async (req, res) => {
    try {
        const { id } = req.params;
        const { session_id } = req.body; // delete usually doesn't have body in some clients, but axios supports it.
        const data = await avatarService.deleteStream(id, session_id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
