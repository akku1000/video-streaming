import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Copy, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hookcontext/HookContext';

// Move socket outside or use useMemo to prevent re-initialization
const socket = io('https://video-streaming-backend-jgil.onrender.com');

const VideoPage = () => {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState("Remote Participant");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const servers = {

iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]

};

  // --- 1. Cleanup Function ---
  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    setRemoteUserName("Remote Participant");
  }, []);

  // --- 2. Initialize Peer Connection ---
  const initPeerConnection = useCallback(async () => {
    if (peerConnection.current) return peerConnection.current;

    const pc = new RTCPeerConnection(servers);

    // Attach local tracks immediately
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    // FIX: Handle ice connection state changes for debugging
    pc.oniceconnectionstatechange = () => {
      console.log("ICE State:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setRemoteUserName("Connection Lost...");
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [roomId]);

  // --- 3. Signaling Listeners ---
  useEffect(() => {
    const handleUserConnected = async (newcomerName) => {
      setRemoteUserName(newcomerName);
      socket.emit('return-name', { roomId, userName: user?.fullname });

      const pc = await initPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, sdp: offer });
    };

    const handleOffer = async ({ sdp }) => {
      const pc = await initPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, sdp: answer });
    };

    const handleAnswer = async ({ sdp }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnection.current) {
        try {
          // IMPORTANT: Only add candidates if we have a remote description
          if (peerConnection.current.remoteDescription) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.error("ICE Error", e);
        }
      };
    };

    socket.on('user-connected', handleUserConnected);
    socket.on('receiving-name', (name) => setRemoteUserName(name));
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-disconnected', cleanup);

    return () => {
      socket.off('user-connected');
      socket.off('receiving-name');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
    };
  }, [roomId, user, initPeerConnection, cleanup]);

  const startCall = async () => {
    try {
      // Get media FIRST, then join room
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      setIsJoined(true);
      socket.emit('join-room', roomId, user?.fullname || "Anonymous");
    } catch (err) {
      alert("Media access denied. Please check camera permissions.");
    }
  };

  const endCall = () => {
    cleanup();
    navigate('/dashboard');
  };

  // UI Toggles (Mute/Camera)
  const toggleMute = () => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      track.enabled = isMuted; // Toggle based on state
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream.current) {
      const track = localStream.current.getVideoTracks()[0];
      track.enabled = isCameraOff; 
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-white p-4 md:p-8 flex flex-col items-center'>
      {/* ... Header UI same as before ... */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
        <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border-2 border-zinc-800">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs uppercase font-bold">You {isMuted && "• Muted"}</div>
        </div>
        <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border-2 border-emerald-500/30">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-emerald-500/60 px-3 py-1 rounded-lg text-xs uppercase font-bold">{remoteUserName}</div>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4">
        {!isJoined ? (
          <button onClick={startCall} className="bg-emerald-600 p-6 rounded-full hover:bg-emerald-500 hover:scale-105 transition-all shadow-lg">
            <Phone size={32} />
          </button>
        ) : (
          <div className="flex gap-4 bg-zinc-900 p-4 rounded-full border border-zinc-800 shadow-2xl">
            <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-rose-500 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button onClick={endCall} className="bg-rose-600 p-4 rounded-full hover:bg-rose-500 transition-all">
              <PhoneOff size={24} />
            </button>
            <button onClick={toggleCamera} className={`p-4 rounded-full transition-colors ${isCameraOff ? 'bg-rose-500 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`}>
              {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;