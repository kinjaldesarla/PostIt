import mongoose, { Document, Types } from "mongoose";
import { IPost } from "./post.model";
import { IUser } from "./user.model";

export interface IComment extends Document{
  comment:string,
  commentPost:Types.ObjectId|IPost,
  commentOwner:Types.ObjectId|IUser,
  commentLike:(Types.ObjectId | IUser)[],
}
const commentSchema= new mongoose.Schema({
    comment:{
        type:String,
        required:true,
    },
    commentPost:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post"
    },
    commentOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    commentLike:[{
         type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
},{timestamps:true})

export const Comment =mongoose.model<IComment>('Comment',commentSchema)