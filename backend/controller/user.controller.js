import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
dotenv.config()

const generateacesstoken=async(userid)=>{
    const accesstoken=jwt.sign({userid},process.env.JWT_SECRET,{expiresIn:"15m"})
    return accesstoken;
}

const setCookies=async(res,accesstoken)=>{
    res.cookie("accesstoken",accesstoken,{
        httpOnly:true,// prevent xss attack 
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",//prevents CSRF attack request forgery attack
        maxAge:15*60*1000
    
    })
}
const signup=async(req,res)=>{
    try {
        // console.log("signi");
        const {fullname,email,password}=req.body;

        if(!fullname||!email||!password){
            return res.status(400).json({message:"Enter all detail"});
        }

        const userexist=await User.findOne({email})
        if(userexist){
            return res.status(400).json({message:"User already exist"})
        }

        const user=await User.create({fullname,email,password});

        // generate token
        const accesstoken=await generateacesstoken(user._id)
        setCookies(res,accesstoken)
        res.status(201).json({
            message:"User created successfully",
            user:{
            _id:user._id,
            fullname:user.fullname,
            email:user.email,
            }
        })
    } catch (error) {
        return res.status(500).json({message:error.message})
    
    }
}

const login=async(req,res)=>{
    try {
        const {email,password}=req.body;
        //console.log(password);
        if(!email||!password){
            res.status(400).json({message:"enter all field"})
        }
        const user=await User.findOne({email});
        //console.log(user.password);
        if(!user){
            return res.status(400).json({message:"Invalid email or Signup first"})
        }
        const pass=await user.isconfirmpass(password);
        if(!pass){
            return res.status(400).json({message:"Invalid password"})
        }
        const acesstoken=await generateacesstoken(user._id)
        setCookies(res,acesstoken)
       res.status(201).json({
        user:{
            _id:user._id,
            fullname:user.fullname,
            email:user.email,
        },message:"login success"})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}
const profile=async(req,res)=>{
  const user=req.user
  try {
    res.json(user)
  } catch (error) {
    res.status(500).json({message:error.message})
  }
}
const logout=async(req,res)=>{
  try {
      const accesstoken=req.cookies.accesstoken;
      res.clearCookie("accesstoken");
      res.json({message:"logout success"})
  } catch (error) {
    res.status(500).json({message:error.message})
  }
}
export {signup,login,profile,logout}