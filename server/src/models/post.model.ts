import mongoose, { Document, Types } from "mongoose";
import { IUser } from "./user.model";
import { IComment } from "./comment.model";

export interface IPost extends Document{
   post:string[],
   caption:string,
   postOwner:Types.ObjectId | IUser,
   postComment:(Types.ObjectId |IComment)[] ,
   postLike:(Types.ObjectId |IUser)[]
}
// Extend IPost for populated case
export interface IPostPopulated extends Omit<IPost, "postOwner"> {
  postOwner: IUser; 
}
const postSchema= new mongoose.Schema({
     post:[{
        type:String,
        required:true,
    }],
    caption:{
        type:String,
        required:true,
    },
    postOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    postComment:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    }],
    postLike:[{
         type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
},{timestamps:true})

export const Post =mongoose.model<IPost>('Post',postSchema)