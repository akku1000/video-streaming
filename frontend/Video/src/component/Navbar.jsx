// import { ShoppingCart, UserPlus, LogIn, LogOut, Lock } from "lucide-react";
import { Link } from "react-router-dom";
// import useAuthCheck from "../hooks/Authhook";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hookcontext/HookContext";
// import { useUseStore } from "../stores/useUserStore";
const Navbar = () => {
  const { user, loading, setUser } = useAuth();
  const navigate=useNavigate();
  const handlelogout=async()=>{
     try {
      await axios.post("https://video-streaming-backend-jgil.onrender.com/api/users/logout",{
        withCredentials: true,
      });
      setUser(null);
      navigate('/')
    } catch (error) {
      console.error("Logout failed", error);
    }
  }
  const handlemeeting=async()=>{
     navigate('/dashboard')
  }
  return (
    <header className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap justify-between items-center">
          <Link to="/"
            className="text-2xl font-bold text-emerald-400 items-center space-x-2 flex"
          >
            Virtual connect
          </Link>

          <nav className="flex flex-wrap items-center gap-4">
            {user&&<button onClick={handlemeeting}  className="text-2xl font-bold text-emerald-400 items-center space-x-2 flex">Meeting</button>}
          
            {user ? (
              <button
                onClick={handlelogout}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 
						rounded-md flex items-center transition duration-300 ease-in-out"
              >
                <span className="hidden sm:inline ml-2">Log Out</span>
              </button>
            ) : (
              <>
                <Link
                  to={"/signup"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 
									rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  Sign Up
                </Link>
                <Link
                  to={"/login"}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 
									rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
