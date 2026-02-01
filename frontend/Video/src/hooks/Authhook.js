// import { useEffect, useState } from "react";
// import axios from "axios";

// const useAuthCheck = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchUser = async () => {
//     try {
//       const res = await axios.get("/api/users/profile", {
//         withCredentials: true,
//       });
//       setUser(res.data);
//     } catch {
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   return { user, loading, refetchUser: fetchUser };
// };

// export default useAuthCheck;
