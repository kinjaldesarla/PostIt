import { IUser } from "../models/user.model"
import { Response,Request } from "express";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { Post } from "../models/post.model";

 interface AuthRequest extends Request{
    user?:IUser
 }
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "User ID is required");

    const { postId } = req.params;
    if (!postId) throw new ApiError(400, "Post ID is required");

    const { comment } = req.body;
    if (!comment?.trim()) throw new ApiError(400, "Comment text is required");

    // Create comment
    let newComment = await Comment.create({
      comment,
      commentPost: postId,
      commentOwner: userId,
    });

    // Push the comment ID into the post's comment list
    await Post.findByIdAndUpdate(postId, {
      $push: { postComment: newComment._id },
    });

    // Populate for frontend display
    newComment = await newComment.populate("commentOwner", "username profilePhoto");

    return res
      .status(200)
      .json(new ApiResponse(200, { newComment }, "Comment added successfully"));
  } catch (error) {
    console.error("Add Comment Error:", error);
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { commentId } = req.params;

    if (!userId) throw new ApiError(400, "User ID is required");
    if (!commentId) throw new ApiError(400, "Comment ID is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    // Check ownership
    if (comment.commentOwner.toString() !== userId.toString()) {
      throw new ApiError(403, "You can delete only your own comment");
    }

    // ✅ Remove the comment reference from the post
    await Post.findByIdAndUpdate(comment.commentPost, {
      $pull: { postComment: commentId },
    });

    await Comment.findByIdAndDelete(commentId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  } catch (error) {
    console.error("Delete Comment Error:", error);
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const toggleLikeComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { commentId } = req.params;

    if (!userId) throw new ApiError(400, "User ID is required");
    if (!commentId) throw new ApiError(400, "Comment ID is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    const alreadyLiked = comment.commentLike.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      comment.commentLike = comment.commentLike.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.commentLike.push(userId);
    }

    await comment.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          likesCount: comment.commentLike.length,
          likedByUser: !alreadyLiked,
        },
        alreadyLiked
          ? "Comment unliked successfully"
          : "Comment liked successfully"
      )
    );
  } catch (error) {
    console.error("Toggle Comment Like Error:", error);
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

