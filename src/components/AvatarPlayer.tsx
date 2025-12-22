"use client";

import React, { useEffect, useRef } from "react";

interface AvatarPlayerProps {
    streamId: string | null;
    sessionId: string | null;
    offer?: RTCSessionDescriptionInit;
    iceServers?: RTCIceServer[];
    visualsMocked?: boolean;
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    onStreamReady: () => void;
    onAnswerCreated: (answer: RTCSessionDescriptionInit) => void;
}

export const AvatarPlayer: React.FC<AvatarPlayerProps> = ({
    streamId,
    sessionId,
    offer,
    iceServers,
    visualsMocked,
    onIceCandidate,
    onStreamReady,
    onAnswerCreated,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        if (!streamId || !offer || visualsMocked) {
            if (visualsMocked) onStreamReady();
            return;
        }

        console.log("🎬 SIMPLE AVATAR PLAYER: Starting connection");

        const pc = new RTCPeerConnection({
            iceServers: iceServers?.length ? iceServers : [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerConnectionRef.current = pc;

        pc.onicecandidate = (e) => {
            if (e.candidate) onIceCandidate(e.candidate);
        };

        pc.ontrack = (event) => {
            console.log("📺 Track received:", event.track.kind);
            event.track.enabled = true;

            const stream = event.streams[0];

            if (event.track.kind === 'video' && videoRef.current) {
                console.log("🎥 Attaching VIDEO stream");
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.log("Video play:", e.message));
            }

            if (event.track.kind === 'audio' && audioRef.current) {
                console.log("🔊 Attaching AUDIO stream");
                audioRef.current.srcObject = stream;
                audioRef.current.play().catch(e => console.log("Audio play:", e.message));
            }

            onStreamReady();
        };

        pc.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => pc.createAnswer())
            .then(answer => {
                pc.setLocalDescription(answer);
                onAnswerCreated(answer);
                console.log("✅ Answer sent");
            })
            .catch(err => console.error("Connection error:", err));

        return () => {
            console.log("🧹 Cleanup");
            pc.close();
            peerConnectionRef.current = null;
        };
    }, [streamId, offer]);

    if (visualsMocked) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                    <div className="w-24 h-24 bg-purple-500 rounded-full mx-auto mb-4 animate-pulse" />
                    <p>Sesli Mod (Görsel Yok)</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black relative">
            {/* Status badge */}
            <div className="absolute top-2 left-2 z-50 bg-green-500 text-white px-2 py-1 rounded text-xs">
                {streamId ? "🟢 CANLI" : "⚪ Kapalı"}
            </div>

            {/* Separate VIDEO element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                controls
                style={{ backgroundColor: '#000' }}
            />

            {/* Separate AUDIO element */}
            <audio
                ref={audioRef}
                autoPlay
            />
        </div>
    );
};
