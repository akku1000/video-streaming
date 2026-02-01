import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, Video, Copy, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hookcontext/HookContext';
// import useAuthCheck from '../hooks/Authhook';

const socket = io('http://localhost:5000');

const VideoPage = () => {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState("Remote Participant");
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();
  const localStream = useRef();

  const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  // --- Utility: Copy Room ID/Link ---
  const copyInviteLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- WebRTC: Create Peer Connection ---
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(servers);

    // Push local tracks to the connection
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    return pc;
  };

  // --- Action: Start Call ---
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsJoined(true);

      // Join the room and send local name
      socket.emit('join-room', roomId, user?.fullname || "Anonymous");
    } catch (err) {
      console.error("Media access denied:", err);
      alert("Please allow camera and microphone access.");
    }
  };

  // --- Action: End Call ---
  const endCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    navigate('/dashboard');
  };

  // --- WebRTC & Signaling Logic ---
  useEffect(() => {
    // 1. Newcomer joined (Creator receives this)
    socket.on('user-connected', async (newcomerName) => {
      console.log(`${newcomerName} joined the room.`);
      setRemoteUserName(newcomerName);

      // HANDSHAKE: Send creator's name back to the newcomer
      socket.emit('return-name', { roomId, userName: user?.fullname });

      // Initiate WebRTC Offer
      peerConnection.current = createPeerConnection();
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { roomId, sdp: offer });
    });

    // 2. Receiving Name Back (Newcomer receives this)
    socket.on('receiving-name', (creatorName) => {
      setRemoteUserName(creatorName);
    });

    // 3. Handle Offer
    socket.on('offer', async ({ sdp }) => {
      if (!peerConnection.current) peerConnection.current = createPeerConnection();
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { roomId, sdp: answer });
    });

    // 4. Handle Answer
    socket.on('answer', async ({ sdp }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // 5. Handle ICE Candidates
    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // 6. Handle User Disconnect
    socket.on('user-disconnected', (userName) => {
      console.log(`${userName} left the call.`);
      setRemoteUserName("Remote Participant");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      // Clean up peer connection for next person
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
  }, [roomId, user]);

  return (
     <div>
      <div className='relative min-h-screen text-white overflow-hidden bg-emerald-700'>
    <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
     <div className='relative min-h-screen bg-zinc-950 text-white font-sans overflow-hidden'>
      {/* Background Decor */}
      <div className='absolute inset-0 bg-emerald-700/5 pointer-events-none' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 flex flex-col items-center min-h-screen'>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mb-12 gap-6 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-2xl shadow-inner">
              <Video className="text-emerald-500" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Virtual Connect</h1>
              <p className='text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1'>Encrypted Session</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500">ROOM: {roomId}</span>
              <button 
                onClick={copyInviteLink} 
                className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-500 hover:text-emerald-400 transition-all"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy ID"}
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl flex-grow:1 items-center">
          
          {/* Local Feed */}
          <div className="relative group aspect-video bg-zinc-900 rounded-[2.5rem] border-2 border-zinc-800 overflow-hidden shadow-2xl transition-all hover:border-zinc-700">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-6 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-800">
              {user?.fullname || "You"} (Local)
            </div>
          </div>

          {/* Remote Feed */}
          <div className="relative group aspect-video bg-zinc-900 rounded-[2.5rem] border-2 border-emerald-500/20 overflow-hidden shadow-2xl transition-all hover:border-emerald-500/40">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-6 bg-emerald-500/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-emerald-400">
              {remoteUserName === "Remote Participant" && !isJoined ? "Waiting..." : remoteUserName}
            </div>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="mt-12 mb-8">
          {!isJoined ? (
            <button 
              onClick={startCall} 
              className="group relative flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-full hover:bg-emerald-500 hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
            >
              <Phone size={32} />
              <span className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-zinc-800 text-[10px] font-bold py-2 px-4 rounded-xl border border-zinc-700 uppercase tracking-widest">Join Audio & Video</span>
            </button>
          ) : (
            <button 
              onClick={endCall} 
              className="w-20 h-20 bg-rose-600 rounded-full hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)] flex items-center justify-center"
            >
              <PhoneOff size={32} />
            </button>
          )}
        </div>
      </div>
    </div>
    
    </div>
  </div></div>
    
  );
}

export default VideoPage;