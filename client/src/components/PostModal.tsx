import React, {  useState } from "react";
import { Heart, X } from "lucide-react";
import axiosInstance from "../utils/AxiosInstances";
import { toast } from "react-toastify";
import { formatTimeAgo } from "../utils/FormatTime";
import type { Comment, Post } from "../types/PostComment";

interface PostModalProps {
  post: Post;
  onClose: () => void;
  refresh: () => void;
  currentUserId: string;
  deletePost?:(postId:string)=>void;
  onUpdatePost: (updatedPost:any) =>void;
}


const PostModal: React.FC<PostModalProps> = ({
  post,
  onClose,
  currentUserId,
  deletePost,
   onUpdatePost
}) => {
 const [likedByUser, setLikedByUser] = useState(post.likedByUser || false);
const [likesCount, setLikesCount] = useState(post.likesCount || 0);
const [comments, setComments] = useState<Comment[]>(post.postComment || []);
const [activeIndex, setActiveIndex] = useState(0);
const [newComment, setNewComment] = useState("");

  // ✅ Toggle like on the post
 const toggleLike = async (postId: string) => {
  try {
    const res = await axiosInstance.patch(
      `post/toggle-like-post/${postId}`,
      {},
      { withCredentials: true }
    );
    const liked = res.data.data.liked;

    setLikedByUser(liked);
    setLikesCount((prev) => (liked ? prev + 1 : Math.max(0, prev - 1)));

    // ✅ Update parent grid
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        likedByUser: liked,
        likesCount: liked ? likesCount + 1 : Math.max(0, likesCount - 1),
      });
    }
  } catch {
    toast.error("Failed to update like");
  }
};


  // ✅ Add comment
const handleAddComment = async () => {
  if (!newComment.trim()) return;
  try {
    const res = await axiosInstance.post(
      `comment/add-comment/${post._id}`,
      { comment: newComment },
      { withCredentials: true }
    );
    const newCmt = res.data.data.newComment;
    setComments((prev) => [...prev, newCmt]);
    setNewComment("");

    // Update parent grid's commentsCount
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        commentsCount: comments.length + 1,
      });
    }
  } catch {
    toast.error("Failed to add comment");
  }
};

  // ✅ Toggle comment like
  const toggleCommentLike = async (commentId: string) => {
    try {
      const res = await axiosInstance.patch(
        `comment/toggle-like-comment/${commentId}`,
        {},
        { withCredentials: true }
      );
      const { likedByUser, likesCount } = res.data.data;
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, likedByUser, likesCount } : c
        )
      );
    } catch {
      toast.error("Failed to like comment");
    }
  };

  // ✅ Delete comment
const handleDeleteComment = async (commentId: string) => {
  try {
    await axiosInstance.delete(`comment/delete-comment/${commentId}`, {
      withCredentials: true,
    });
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    toast.success("Comment deleted");

    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        commentsCount: comments.length - 1,
      });
    }
  } catch {
    toast.error("Failed to delete comment");
  }
};


  return (
    <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-xl">
        {/* LEFT: Image(s) */}
        <div className="relative bg-black flex items-center justify-center w-full md:w-1/2 h-[50vh] md:h-full overflow-hidden">
          <img
            src={post.post[activeIndex]}
            alt="post"
            className="object-contain max-h-full w-auto"
          />
          {post.post.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveIndex(
                    (prev) => (prev - 1 + post.post.length) % post.post.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setActiveIndex((prev) => (prev + 1) % post.post.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* RIGHT: Comments & Details */}
        <div className="flex flex-col justify-between w-full md:w-1/2">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  post.postOwner.profilePhoto ||
                  'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
                }
                alt="user"
                className="w-8 h-8 rounded-full"
              />
              <p className="font-semibold text-sm">{post.postOwner.username}</p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-600 hover:text-gray-800 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Caption + Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[55vh]">
            {post.caption && (
              <p className="flex gap-3 items-start">
                <img
                  src={post.postOwner.profilePhoto}
                  alt="profile"
                  className="w-7 h-7 rounded-full"
                />
                <span className="text-sm">
                  <span className="font-semibold mr-1">
                    {post.postOwner.username}
                  </span>
                  {post.caption}
                </span>
              </p>
            )}

            {/* Comments */}
            {comments.map((c) => (
              <div
                key={c._id}
                className="flex items-start justify-between gap-3 group"
              >
                <div className="flex gap-2">
                  <img
                    src={c.commentOwner?.profilePhoto}
                    alt="comment-user"
                    className="w-7 h-7 rounded-full"
                  />
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold mr-1">
                        {c.commentOwner?.username}
                      </span>
                      {c.comment}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{formatTimeAgo(c.createdAt)}</span>
                      <span>
                        {c.likesCount}{" "}
                        {c.likesCount ===1 || c.likesCount ===0 ? "like" : "likes"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* ❤️ Comment Like */}
                  <button
                    title="Like comment"
                    onClick={() => toggleCommentLike(c._id)}
                    className={`text-xs transition-transform duration-200 hover:scale-110 ${
                      c.likedByUser
                        ? "text-red-500"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Heart
                      size={14}
                      className={c.likedByUser ? "fill-current" : ""}
                    />
                  </button>

                  {/* 🗑️ Delete Button */}
                  {c.commentOwner._id === localStorage.getItem("userid") && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      className="text-gray-400 hover:text-red-500 transition-all duration-200 text-sm"
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => toggleLike(post._id)}
                  className={`transition-transform duration-200 hover:scale-110 ${
                    likedByUser
                      ? "text-red-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Heart
                    size={24}
                    className={likedByUser ? "fill-current" : ""}
                  />
                </button>

                <div>
                 <p className="font-semibold">{likesCount} likes</p>
<p className="text-gray-500">{comments.length} comments</p>

                </div>
              </div>
              <div>
                <p>{post.postOwner._id===currentUserId?(<button
      onClick={(e) => {
        e.stopPropagation(); // Prevent opening PostModal
        deletePost?.(post._id);
      }}
      className="px-4 py-1 text-sm bg-red-500 hover:bg-red-600 rounded text-white"
    >
      Delete
    </button>):''}</p>
                <p className="text-xs m-3 text-gray-500">
                  {formatTimeAgo(post.createdAt)} ago
                </p>
              </div>
            </div>
          </div>

          {/* Add Comment */}
          {post.postOwner._id !== currentUserId && (
            <div className="border-t p-3 flex items-center gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={handleAddComment}
                className="text-blue-500 font-semibold text-sm"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostModal;
