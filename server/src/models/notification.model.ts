import mongoose, { Document, Types } from "mongoose";
import { IUser } from "./user.model";
import { IPost } from "./post.model";
import { IComment } from "./comment.model";

export interface INotification extends Document {
  user: Types.ObjectId | IUser;       // Receiver (who gets notified)
  sender: Types.ObjectId | IUser;     // Sender (who triggers notification)
  type: "follow" | "comment" | "like"; 
  status?: "pending" | "accepted" | "rejected"; 
  post?: Types.ObjectId | IPost;
  comment?: Types.ObjectId | IComment;
}

const notificationSchema = new mongoose.Schema<INotification>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["follow"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted"],
    default: null, // only used if type === "follow"
  },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);

