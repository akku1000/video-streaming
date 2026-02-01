import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import User from "../models/user.model.js";
dotenv.config()

const authuser = async (req, res, next) => {
   const accesstoken = req.cookies.accesstoken;

   if (!accesstoken) {
      return res.status(401).json({ message: "Unauthorized - no tokens" });
   }

   try {
      const decode = jwt.verify(accesstoken, process.env.JWT_SECRET);
      
      const user = await User.findById(decode.userid).select("-password");
      
      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      next(); // Move to the next controller
      
   } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
   }
}

export default authuser;