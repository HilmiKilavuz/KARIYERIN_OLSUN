import axios from 'axios';
import { config } from '../config/env.js';

const apiClient = axios.create({
    baseURL: config.avatarBotUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const createStream = async (userId) => {
    const response = await apiClient.post('/api/streams/create', { userId });
    return response.data;
};

export const startStream = async (id, sdp, session_id) => {
    // server.js updated to expect 'sdp' and 'session_id'
    console.log("Service startStream sending:", { sdp, session_id });
    const response = await apiClient.post(`/api/streams/${id}/start`, { sdp, session_id });
    return response.data;
};

export const submitIceCandidate = async (id, candidate, sdpMid, sdpMLineIndex, session_id) => {
    const response = await apiClient.post(`/api/streams/${id}/ice`, {
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id
    });
    return response.data;
};

export const talkToAvatar = async (id, text, session_id) => {
    const response = await apiClient.post(`/api/streams/${id}/talk`, { text, session_id });
    return response.data;
};

export const startInterview = async (id, session_id, userId) => {
    const response = await apiClient.post(`/api/streams/${id}/start-interview`, { session_id, userId });
    return response.data;
};

export const deleteStream = async (id, session_id) => {
    const response = await apiClient.delete(`/api/streams/${id}`, {
        data: { session_id }
    });
    return response.data;
};
