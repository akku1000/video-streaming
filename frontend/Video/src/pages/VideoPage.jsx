import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Copy, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hookcontext/HookContext';

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

  // --- 1. Initialize Peer Connection (Shared Logic) ---
  const initPeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const pc = new RTCPeerConnection(servers);

    // Add local tracks to PC
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [roomId]);

  // --- 2. Action: Start Call ---
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      setIsJoined(true);
      socket.emit('join-room', roomId, user?.fullname || "Anonymous");
    } catch (err) {
      alert("Please allow camera/mic access.");
    }
  };

  // --- 3. Signaling Logic (The fix for stability) ---
  useEffect(() => {
    // When someone joins, the person already in the room starts the offer
    socket.on('user-connected', async (newcomerName) => {
      setRemoteUserName(newcomerName);
      socket.emit('return-name', { roomId, userName: user?.fullname });

      const pc = initPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, sdp: offer });
    });

    socket.on('receiving-name', (name) => setRemoteUserName(name));

    socket.on('offer', async ({ sdp }) => {
      const pc = initPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, sdp: answer });
    });

    socket.on('answer', async ({ sdp }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on('user-disconnected', () => {
      setRemoteUserName("Remote Participant");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    });

    return () => {
      socket.off('user-connected');
      socket.off('receiving-name');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
    };
  }, [roomId, user, initPeerConnection]);

  // --- Controls ---
  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks()[0].enabled = isCameraOff;
      setIsCameraOff(!isCameraOff);
    }
  };

  const endCall = () => {
    localStream.current?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
    navigate('/dashboard');
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-white p-8 flex flex-col items-center'>
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 bg-zinc-900 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <Video className="text-emerald-500" />
          <h1 className="font-bold">VIRTUAL CONNECT</h1>
        </div>
        <button onClick={copyInviteLink} className="text-xs bg-zinc-800 px-4 py-2 rounded-lg flex items-center gap-2">
          {copied ? <Check size={14} /> : <Copy size={14} />} Room ID: {roomId}
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border-2 border-zinc-800">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-xs">You {isMuted && "(Muted)"}</div>
        </div>
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border-2 border-emerald-500/30">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-emerald-500/50 px-3 py-1 rounded-lg text-xs">{remoteUserName}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-10 flex gap-4">
        {!isJoined ? (
          <button onClick={startCall} className="bg-emerald-600 p-6 rounded-full hover:bg-emerald-500 transition-all">
            <Phone size={30} />
          </button>
        ) : (
          <>
            <button onClick={toggleMute} name="Mute Toggle" className={`p-4 rounded-full ${isMuted ? 'bg-rose-500' : 'bg-zinc-800'}`}>
              {isMuted ? <MicOff /> : <Mic />}
            </button>
            <button onClick={endCall} name="End Call" className="bg-rose-600 p-4 rounded-full">
              <PhoneOff size={30} />
            </button>
            <button onClick={toggleCamera} name="Camera Toggle" className={`p-4 rounded-full ${isCameraOff ? 'bg-rose-500' : 'bg-zinc-800'}`}>
              {isCameraOff ? <VideoOff /> : <Video />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoPage;