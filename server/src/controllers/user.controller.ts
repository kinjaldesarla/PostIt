import { IUser, User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { CookieOptions, Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { deleteImageOnCloudinary, uploadOnCloudinary } from "../utils/Cloudinary";
import { Notification } from "../models/notification.model";
import { Post } from "../models/post.model";
import mongoose, { ObjectId } from "mongoose";

const defaultCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "none",  
  secure: true,
};
 interface AuthRequest extends Request{
    user?:IUser
}

export const registerUser=async(req:Request,res:Response)=>{
    try {
        const {fullname,email,username,password}=req.body 
   if(
    [fullname,username,email,password].some((field)=>
    field?.trim() === "")
){
    throw new ApiError(400,"all fields are required")
}
// some validations
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new ApiError(400, "Invalid email format");
}

//  password validation (regex)
const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\'":\\\\|,.<>\\/?]).{8,}$'
);
if (!passwordRegex.test(password)) {
  throw new ApiError(
    400,
    "Password must be at least 8 characters, and include lowercase, digit, and special character."
  );
}
const existedUser=await User.findOne({
    $or:[{username},{email}]
})

if(existedUser){
    throw new ApiError(409,"user with this email/mobileNumber or username already exist")
   }
  const user=await User.create({
    username:username.trim().toLowerCase(),
    fullname,
    password,
    email
  })
  if(!user){
    throw new ApiError(500,"something went wrong while registering the user")
  }
  const accesstoken=user.generateAccessToken();
  const refreshtoken=user.generateRefreshToken();
     user.refreshToken=refreshtoken;
     await user.save({ validateBeforeSave: false });
     const AuthenicatedUser =await User.findById(user._id).select("-password -refreshToken")
     return res
    .status(200)
   .cookie("accessToken", accesstoken, defaultCookieOptions)
    .cookie("refreshToken", refreshtoken, defaultCookieOptions)
    .json(
        new ApiResponse(
            200, 
            {
                AuthenicatedUser , accesstoken, refreshtoken
            },
           "User Register Successfully"
        )
    )
    } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      console.error(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const loginUser=async(req:Request,res:Response)=>{
  try {
     const {identifier,password}=req.body
    if(!identifier){
        throw new ApiError(400,"Username or email is required")
    }
    if(!password){
         throw new ApiError(400,"password is required")
    }
   const user= await User.findOne({
        $or:[{username:identifier},{email:identifier}]
    })
    if(!user){
        throw new ApiError(404,"User with this username or email does not exists")
    }
    const isPasswordMatch= await user.isPasswordMatch(password);
    if(!isPasswordMatch){
        throw new ApiError(401,"invalid password")
    }
  const accesstoken=user.generateAccessToken();
  const refreshtoken=user.generateRefreshToken();
     user.refreshToken=refreshtoken;
     await user.save({ validateBeforeSave: false });
   const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

 return res
    .status(200)
    .cookie("accessToken", accesstoken, defaultCookieOptions)
    .cookie("refreshToken", refreshtoken, defaultCookieOptions)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accesstoken, refreshtoken
            },
            "User logged In Successfully"
        )
    )
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const logoutUser =async(req:AuthRequest,res:Response)=>{
try {
  if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
    }
      await User.findByIdAndUpdate(
      req.user._id,
      {
       $unset:{
           refreshToken:1
       }
      },
      {
          new:true
      }
   )
  
   return res
   .status(200)
   .clearCookie("accessToken",defaultCookieOptions)
   .clearCookie("refreshToken",defaultCookieOptions)
   .json(new ApiResponse(200,{},"user logged out"))
} catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const editUserProfile=async(req:AuthRequest,res:Response)=>{
  try {
    const userId= req.user?.id;
    const{username,fullname,bio,isPrivate}=req.body;
    const user=await User.findById(userId);
    if(!user){
      throw new ApiError(404,"user not found")
    }
    if (fullname) user.fullname = fullname;
    if (username) user.username = username.trim().toLowerCase();
    if (bio) user.bio = bio;
    if (isPrivate ) user.isPrivate = isPrivate;
    if(req.file){
      if(user.profilePhotoPublicId && user.profilePhotoPublicId!== null){
       await deleteImageOnCloudinary(user.profilePhotoPublicId);
      }
      console.log("start toh karo console karnaaa");  
      console.log(user.profilePhotoPublicId );
     const localFilePath=req.file.path 
    if(!localFilePath){
        throw new ApiError(400,"profile photo is required")
    }
    const profile = await uploadOnCloudinary(localFilePath);
    if(!profile){
        throw new ApiError(500,"something went wronng while uploading on cloudinary")
    }
    user.profilePhoto=profile.secure_url;
    user.profilePhotoPublicId=profile.public_id;
    }
 await user.save();
 return res
 .status(200)
 .json(new ApiResponse(200,{user},"user profile updated"))
  }  catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      console.error(error); 
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const changePassword = async(req:AuthRequest,res:Response)=>{
  try {
    const userId= req.user?.id;
    const {oldPassword,newPassword,confirmPassword}=req.body;
      if(!oldPassword && !newPassword && !confirmPassword){
        throw new ApiError(400,"passwords are required")
    }
    const user=await User.findById(userId);
    if(!user){
  throw new ApiError(404,"user not found")
    }
     const isPasswordCorrect = await user.isPasswordMatch(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"password is incorrect")
    }
    //  password validation (regex)
const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\'":\\\\|,.<>\\/?]).{8,}$'
);
if (!passwordRegex.test(newPassword)) {
  throw new ApiError(
    400,
    "Password must be at least 8 characters, and include lowercase, digit, and special character."
  );
}
if(!(newPassword===confirmPassword)){
    throw new ApiError(400,"new and confirm password are not same")
}
 user.password=newPassword;
   await  user.save({validateBeforeSave:false})
   return res
   .status(200)
   .json(new ApiResponse(200,{},"password changed successfully"))
   
  }  catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

// Fixed removeFollower - Add notification deletion
export const removeFollower = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { followerId } = req.params; 

    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }
    if (!followerId) {
      throw new ApiError(400, "Follower ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.followers.some(id => id.toString() === followerId)) {
      user.followers = user.followers.filter(
        (id) => id.toString() !== followerId
      );
      await user.save();

      // remove the logged-in user from the follower's "following" list
      await User.findByIdAndUpdate(followerId, {
        $pull: { following: userId }
      });

      // 🔥 DELETE THE NOTIFICATION
      await Notification.findOneAndDelete({
        user: userId,
        sender: followerId,
        type: "follow"
      });

    } else {
      throw new ApiError(400, "This user is not your follower");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Follower removed successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// Fixed unfollowUser - Add notification deletion
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { followingId } = req.params;

    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }
    if (!followingId) {
      throw new ApiError(400, "Following ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const followingObjectId = new mongoose.Types.ObjectId(followingId);

    if (user.following.includes(followingObjectId)) {
      // remove from current user's following
      user.following = user.following.filter(
        (id) => id.toString() !== followingId
      );
      await user.save();

      // remove from target user's followers
      await User.findByIdAndUpdate(followingId, {
        $pull: { followers: userId }
      });

      // 🔥 DELETE THE NOTIFICATION
      await Notification.findOneAndDelete({
        user: followingId,
        sender: userId,
        type: "follow"
      });

    } else {
      throw new ApiError(400, "You are not following this user");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User unfollowed successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// Fixed followUser - Handle stale accepted notifications
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const {searchUserId} = req.params;
    const currentUserId = req.user?.id;

    if (!searchUserId ) {
      throw new ApiError(400, "user's id is required to follow that user");
    }

    if (searchUserId  === currentUserId) {
      throw new ApiError(400, "you can not follow yourself");
    }

    const currentUser = await User.findById(currentUserId);
    const userToFollow = await User.findById(searchUserId );

    if (!currentUser || !userToFollow) {
      throw new ApiError(404, "users are not found");
    }

    // Already following
    if (currentUser.following.includes(userToFollow.id)) {
      throw new ApiError(400, "Already following this user");
    }

    // 🔥 Check if a notification already exists between these users
    const existingNotif = await Notification.findOne({
      user: userToFollow._id,
      sender: currentUser._id,
      type: "follow",
    });

    if (existingNotif) {
      if (existingNotif.status === "pending") {
        throw new ApiError(400, "Follow request already sent and pending");
      }
      // 🔥 If accepted notification exists but user is NOT in following array,
      // it means they unfollowed - delete the stale notification
      if (existingNotif.status === "accepted") {
        await Notification.findByIdAndDelete(existingNotif._id);
        // Continue to re-follow logic below
      }
    }

    // If profile is private → send request
    if (userToFollow.isPrivate) {
      const notification = await Notification.create({
        user: userToFollow._id,
        sender: currentUser._id,
        type: "follow",
        status: "pending",
      });

      return res
        .status(200)
        .json(new ApiResponse(200, { notification }, "Follow request sent"));
    } else {
      // Public profile → directly follow
      currentUser.following.push(userToFollow.id);
      userToFollow.followers.push(currentUser.id);

      await currentUser.save();
      await userToFollow.save();

      const notification = await Notification.create({
        user: userToFollow._id,
        sender: currentUser._id,
        type: "follow",
        status: "accepted",
      });

      return res
        .status(200)
        .json(new ApiResponse(200, { notification }, "User followed successfully"));
    }
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// acceptRequest remains the same
export const acceptRequest = async(req: AuthRequest, res: Response) => {
  try {
     const {requestId} = req.params;
     const currentUserId = req.user?.id;

     if(!requestId){
      throw new ApiError(400,"notifications id is required")
     }
     const requestNotification = await Notification.findById(requestId);
   
     if(!requestNotification || requestNotification.type !== "follow" || requestNotification.status !== 'pending'){
      throw new ApiError(404,"follow request not found or already handled")
     }
     if (requestNotification.user.toString() !== currentUserId) {
      throw new ApiError(403, "You are not authorized to accept this request");
    }
     const senderId = requestNotification.sender;
    const receiverId = currentUserId;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      throw new ApiError(404, "Users not found");
    }

    if (!sender.following.includes(receiverId)) {
      sender.following.push(receiverId);
    }
    if (!receiver.followers.includes(senderId)) {
      receiver.followers.push(senderId);
    }

    await sender.save();
    await receiver.save();
    requestNotification.status = "accepted";
    await requestNotification.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {requestNotification}, "Follow request accepted successfully"))

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}


export const getUserProfile=async(req:AuthRequest,res:Response)=>{
try {
  const userId=req.user?.id;
  if(!userId){
    throw new ApiError(400,"user id is required")
  }
   const profile=await User.findById(userId)
   .select("-password -email -mobileNumber -profilePhotoPublicId -refreshToken ")
   .populate("followers","username profilePhoto")
   .populate("following","username profilePhoto")

    if (!profile) {
      throw new ApiError(404,"user not found")
    }
  const posts = await Post.find({postOwner:profile._id})
  .select("post postComment postLike caption")
  .sort({ createdAt: -1 });
      const totalPost=posts.length;
      return res
      .status(200)
      .json(new ApiResponse(200,{profile,posts,totalPost},"user profile fetched successfully"))
  
} catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(400, "User id is required");
    }

    const { query } = req.query; 
    if (!query || typeof query !== "string") {
      throw new ApiError(400, "Search query is required");
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" }, // "i" = ignore case
    })
      .select("username profilePhoto")

    return res.status(200).json(
      new ApiResponse(
        200,
        { users },
        "Users fetched successfully"
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

export const getSearchUserProfile = async (req: Request, res: Response) => {
  try {
    const { searchUserId } = req.params;
    if (!searchUserId) throw new ApiError(400, "user id is required");

    const profile = await User.findById(searchUserId)
      .select("-password -email -mobileNumber -profilePhotoPublicId -refreshToken")
      .populate("followers", "username profilePhoto _id")
      .populate("following", "username profilePhoto _id");

    if (!profile) throw new ApiError(404, "user not found");

    const posts = await Post.find({ postOwner: profile._id })
      .select("post postComment postLike caption createdAt")
      .sort({ createdAt: -1 });

    const postsWithCounts = posts.map((p) => ({
      _id: p._id,
      post: p.post,
      caption: p.caption,
      postOwner: p.postOwner,
      postComment: p.postComment,
      postLike: p.postLike,
      likesCount: p.postLike.length,
      commentsCount: p.postComment.length,
      likedByUser: false, // optional, can compute later if needed
    }));

    const totalPost = posts.length;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { profile, posts: postsWithCounts, totalPost },
          "user profile fetched successfully"
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


export const getFollowersFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params; 
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId)
      .select("_id username profilePhoto")
      .populate("followers", "username profilePhoto")
      .populate("following", "username profilePhoto");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          followers: user.followers, // list of users who follow this user
          following: user.following, // list of users this user follows
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
        "Followers and following fetched successfully"
      )
    );
  }catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};


export const getNotifications =async(req:AuthRequest,res:Response)=>{
  try {
    const userId=req.user?._id
     if (!userId) {
          throw new ApiError(400, "userId is required");
        }
    const notifications =await Notification.find({user:userId})
      .populate("sender", "username profilePhoto") 
      .sort({ createdAt: -1 });
    return res
    .status(200)
    .json(new ApiResponse(200,{notifications},"notifications fetched"))
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const getSearchUserNotifications =async(req:Request,res:Response)=>{
  try {
    const {searchUserId}=req.params
     if (!searchUserId) {
          throw new ApiError(400, "userId is required");
        }
    const notifications =await Notification.find({user:searchUserId})
      .populate("sender", "username profilePhoto") 
      .sort({ createdAt: -1 });
    return res
    .status(200)
    .json(new ApiResponse(200,{notifications},"notifications fetched"))
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export const removeNotification=async(req:AuthRequest,res:Response)=>{
   try {
    const {notificationId}=req.params ;
    const currentUserId=req.user?.id;
    if(!notificationId){
      throw new ApiError(400,"notification id is required")
    }
    const requestNotification =await Notification.findById(notificationId);
    if(!requestNotification || requestNotification.type!=='follow'|| requestNotification.status!=='pending'){
      throw new ApiError (404,"notification not found or already handled")
    }
     if (requestNotification.user.toString() !== currentUserId) {
      throw new ApiError(403, "You are not authorized to accept this request");
    }
   await requestNotification.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Follow request rejected successfully"));

  }catch (error) {
    if (error instanceof ApiError) {
      res.status(error.stautscode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}