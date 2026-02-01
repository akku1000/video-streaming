import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Keyboard } from 'lucide-react';

const Dashboard = () => {
  const [roomInput, setRoomInput] = useState('');
  const navigate = useNavigate();

  // Create a new meeting with a random ID
  const handleCreateMeeting = () => {
    const randomId = Math.random().toString(36).substring(2, 12); // e.g. "a7b2j9k1m0"
    navigate(`/room/${randomId}`);
  };

  // Join a meeting using a code someone shared with you
  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (roomInput.trim()) {
      navigate(`/room/${roomInput.trim()}`);
    }
  };
  return (
       <div>
      <div className='relative min-h-screen text-white overflow-hidden bg-emerald-700'>
    <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
     <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter mb-2">VIRTUAL CONNECT</h1>
          <p className="text-zinc-400">Premium video meetings. Now free for everyone.</p>
        </div>

        <div className="flex flex-col gap-4 mt-10">
          <button 
            onClick={handleCreateMeeting}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-bold transition-all"
          >
            <Plus size={20} /> New Meeting
          </button>

          <div className="relative">
            <form onSubmit={handleJoinMeeting} className="flex gap-2">
              <div className="relative flex-1">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Enter a code or link"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 pl-10 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <button type="submit" className="text-emerald-500 font-bold px-4 hover:bg-emerald-500/10 rounded-xl transition-all">
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    </div>
  </div></div>
  )
}

export default Dashboard