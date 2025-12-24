import { IPost, Post } from "../models/post.model";
import { IUser, User } from "../models/user.model"
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Response,Request } from "express";
import { uploadOnCloudinary } from "../utils/Cloudinary";
import mongoose from "mongoose";

 interface AuthRequest extends Request{
    user?:IUser
}

export const createPost=async(req:AuthRequest,res:Response)=>{
    try {
        const {caption}=req.body;
        const postOwnerId=req.user?.id;
          const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new ApiError(400, "At least one photo is required");
    }
        if(!caption){
            throw new ApiError(400,"caption required")
        }
       
  const uploadedUrls = [];
    for (const file of files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if(uploaded) uploadedUrls.push(uploaded.secure_url);
    }
       const newPost =await Post.create({
        post: uploadedUrls, // store array of image URLs
        caption,
        postOwner:postOwnerId
       })
       return res
       .status(200)
       .json(new ApiResponse(200,{newPost},"post created successfully"))

    } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      console.error(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const updatePostCaption =async(req:AuthRequest,res:Response)=>{
    try {
       const{caption}=req.body;
       const {postId}=req.params;
       if(!postId){
        throw new ApiError(400,"post is is required")
       }
       if(!caption){
        throw new ApiError(400,"new caption is required to edit")
       }
       const updatedPost=await Post.findByIdAndUpdate(postId,
        {
            $set:{
                caption
            }
        },
        {
            new :true
        }
       )
       return res 
       .status(200)
       .json(new ApiResponse(200,{updatedPost},"post updated successfully"))
    } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      console.error(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const {postId} = req.params;
    const userId = req.user?.id; 

    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    // check ownership
    if (post.postOwner.toString() !== userId.toString()) {
      throw new ApiError(403, "You cannot delete someone else’s post");
    }

    await Post.findByIdAndDelete(postId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Post deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      console.error(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
     if (!userId) {
      throw new ApiError(400, "userId is required");
    }
    const currentUser = await User.findById(userId).select("following");
    if (!currentUser) {
      throw new ApiError(404, "User not found");
    }
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "postOwner",
          foreignField: "_id",
          as: "postOwner"
        }
      },
      { $unwind: "$postOwner" },
      {
        $addFields: {
          commentsCount: { $size: { $ifNull: ["$postComment", []] } },
          likesCount: { $size: { $ifNull: ["$postLike", []] } },
          isLikedByUser: { $in: [userId, { $ifNull: ["$postLike", []] }] }
        }
      },
      {
        $project: {
          _id: 1,
          post: 1,
          caption: 1,
          createdAt: 1,
          commentsCount: 1,
          likesCount: 1,
          isLikedByUser: 1,
          "postOwner._id": 1,
          "postOwner.username": 1,
          "postOwner.profilePhoto": 1,
          "postOwner.isPrivate": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // filter privacy
    const filteredPosts = posts.filter((post: any) => {
      const owner = post.postOwner;
      if (!owner.isPrivate) return true;
      if (owner._id.toString() === userId.toString()) return true;
      if (currentUser.following.includes(owner._id)) return true;
      return false;
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { posts: filteredPosts }, "Posts fetched successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const toggleLikePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(400, "User id is required");
    }

    const { postId } = req.params; 
    if (!postId) {
      throw new ApiError(400, "Post id is required");
    }

    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    const alreadyLiked = post.postLike.includes(userId);

    if (alreadyLiked) {
      post.postLike = post.postLike.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.postLike.push(userId);
    }

    await post.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { post, liked: !alreadyLiked }, 
        alreadyLiked ? "Post unliked successfully" : "Post liked successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const getSinglePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id; // current logged-in user

    if (!postId) {
      throw new ApiError(400, "postId is required");
    }

    const objectId = new mongoose.Types.ObjectId(postId);

    const singlePost = await Post.aggregate([
      { $match: { _id: objectId } },

      // 🔹 Get post owner info
      {
        $lookup: {
          from: "users",
          localField: "postOwner",
          foreignField: "_id",
          as: "postOwner",
        },
      },
      { $unwind: "$postOwner" },

      // 🔹 Get comments with their owners
      {
        $lookup: {
          from: "comments",
          localField: "postComment",
          foreignField: "_id",
          as: "postComment",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "commentOwner",
                foreignField: "_id",
                as: "commentOwner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      profilePhoto: 1,
                      _id: 1,
                    },
                  },
                ],
              },
            },
            { $unwind: "$commentOwner" },
            {
              $addFields: {
                likesCount: { $size: "$commentLike" },
                likedByUser: {
                  $in: [
                    userId ? new mongoose.Types.ObjectId(userId) : null,
                    "$commentLike",
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                comment: 1,
                createdAt: 1,
                likesCount: 1,
                likedByUser: 1,
                "commentOwner._id": 1,
                "commentOwner.username": 1,
                "commentOwner.profilePhoto": 1,
              },
            },
          ],
        },
      },

      // 🔹 Add post-level fields
      {
        $addFields: {
          likesCount: { $size: "$postLike" },
          commentsCount: { $size: "$postComment" },
          likedByUser: {
            $in: [
              userId ? new mongoose.Types.ObjectId(userId) : null,
              "$postLike",
            ],
          },
        },
      },

      // 🔹 Final projection
      {
        $project: {
          _id: 1,
          caption: 1,
          createdAt: 1,
          post: 1,
          likesCount: 1,
          commentsCount: 1,
          likedByUser: 1, // ✅ added here
          postComment: 1,
          "postOwner._id": 1,
          "postOwner.username": 1,
          "postOwner.profilePhoto": 1,
        },
      },
    ]);

    if (!singlePost.length) {
      throw new ApiError(404, "Post not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, singlePost[0], "Single post fetched successfully")
      );
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};