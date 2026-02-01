import mongoose from "mongoose";
import bcrypt from "bcrypt"

const userSchema=mongoose.Schema({
    fullname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
        minlength:6,
    }
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next;
    try {
        const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
        next
    } catch (error) {
        next(error)
    }
})

userSchema.methods.isconfirmpass=async function(password){
    return await bcrypt.compare(password,this.password)
}

const User=mongoose.model("User",userSchema)

export default User