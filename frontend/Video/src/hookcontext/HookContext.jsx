import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Create the Context
const HookContext = createContext();

export const HookProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/users/profile", {
        withCredentials: true,
      });
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <HookContext.Provider value={{ user, setUser, loading, refetchUser: fetchUser }}>
      {children}
    </HookContext.Provider>
  );
};

// Custom hook to use the context
export const useAuth = () => {
  return useContext(HookContext);
};