import mongoose, { Document, Types } from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IPost } from "./post.model";
 export interface IUser extends Document{
  _id:Types.ObjectId;
   fullname:string,
   username:string,
   password:string,
   email?:string,
   mobileNumber?:string,
   bio:string,
   profilePhoto:string,
   profilePhotoPublicId:string,
   refreshToken?:string,
   savedPost?:(Types.ObjectId|IPost)[],
   followers: (Types.ObjectId | IUser)[];
  following: (Types.ObjectId | IUser)[];
   isPrivate: boolean;
   isPasswordMatch:(password:string)=>Promise<boolean>,
   generateAccessToken:()=>string,
   generateRefreshToken:()=>string
}
const userSchema = new mongoose.Schema({
   fullname:{
    type:String,
    required:true
   },
   username:{
    type:String,
    required:true,
    unique:true
   },
   password:{
    type:String,
    required:true
   },
   email:{
    type:String,
    unique:true
   },
   bio:{
    type:String,
    default:"hey there! I am using PostIt"
   },
   profilePhoto:{
    type:String,
    default:'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
   },
    profilePhotoPublicId:{
        type:String,
        default:'default_profile_tth4p1'
    },
    refreshToken:{
        type:String
    },
  followers:
   [
    { 
      type: mongoose.Schema.Types.ObjectId,
       ref: "User"
       }
   ],
  following: [
    {
       type: mongoose.Schema.Types.ObjectId,
        ref: "User"
       }
     ],
  isPrivate:
   {
     type: Boolean,
      default: false
     },
},{timestamps:true})

userSchema.pre<IUser>('save',async function (next) {
  if(!this.isModified("password")) return next();
  this.password=await bcrypt.hash(this.password,10)
  next();
})

userSchema.methods.isPasswordMatch= async function(password:string):Promise<boolean>{
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (): string {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN is not defined");
  }
 
  return jwt.sign(
    { id: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

userSchema.methods.generateRefreshToken= function (): string {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN is not defined");
  }
 
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "10d" }
  );
};
export const User=mongoose.model<IUser>('User',userSchema)