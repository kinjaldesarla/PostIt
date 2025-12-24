
import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import {
  Heart,
  MessageCircle,
  X,
} from "lucide-react";
import axiosInstance from "../utils/AxiosInstances";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "../utils/FormatTime";
import type { Post } from "../types/PostComment";




const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const currentuserId = localStorage.getItem("userid");

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get("post/allpost", {
        withCredentials: true,
      });
      const fetchedPosts: Post[] = response.data.data.posts.map((p: Post) => ({
        ...p,
        activeIndex: 0,
      }));
      console.log(response.data.data.posts);
      
      setPosts(fetchedPosts);

      const liked = new Set<string>();
      fetchedPosts.forEach((p) => {
        if (p.isLikedByUser) liked.add(p._id);
      });
      setLikedPosts(liked);
    } catch {
      toast.error("Failed to fetch posts");
    }
  };

  useEffect(() => {
    fetchPosts()
  }, []);

  // Toggle Like
  const toggleLike = async (postId: string) => {
    try {
      const response = await axiosInstance.patch(
        `post/toggle-like-post/${postId}`,
        {},
        { withCredentials: true }
      );
      const liked = response.data.data.liked;

      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        liked ? newSet.add(postId) : newSet.delete(postId);
        return newSet;
      });

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likesCount: liked ? p.likesCount + 1 : p.likesCount - 1 }
            : p
        )
      );
    } catch {
      toast.error("Failed to update like");
    }
  };

  // Carousel control
  const changePhoto = (postId: string, direction: "next" | "prev") => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const current = p.activeIndex || 0;
          const newIndex =
            direction === "next"
              ? (current + 1) % p.post.length
              : (current - 1 + p.post.length) % p.post.length;
          return { ...p, activeIndex: newIndex };
        }
        return p;
      })
    );
  };

  // Open single post modal
  const openPostModal = async (postId: string) => {
    try {
      const res = await axiosInstance.get(`post/post/${postId}`, {
        withCredentials: true,
      });
      const postData = res.data.data
      console.log(postData);
      
      setSelectedPost({ ...postData, activeIndex: 0 });
    } catch {
      toast.error("Failed to load post details");
    }
  };

  // Add new comment
  const handleAddComment = async (postid:string) => {
    console.log("slected",selectedPost);
    
    if (!newComment.trim() || !selectedPost) return;
    try {
      const res = await axiosInstance.post(
        `comment/add-comment/${selectedPost._id}`,
        { comment: newComment },
        { withCredentials: true }
      );

      const newAdded = res.data.data.comment;
      setSelectedPost((prev) =>
        prev
          ? { ...prev, comments: [...(prev.postComment|| []), newAdded] }
          : prev
      );
      console.log('poi',selectedPost);
      setNewComment("");
      openPostModal(postid)
    } catch {
      toast.error("Failed to add comment");
    }
  };


const toggleCommentLike = async (commentId: string) => {
  try {
    const res = await axiosInstance.patch(
      `comment/toggle-like-comment/${commentId}`,
      {},
      { withCredentials: true }
    );

    const { likedByUser, likesCount } = res.data.data;
    console.log("🟢 Comment Like Response:", res.data.data);

    setSelectedPost((prev) =>
      prev
        ? {
            ...prev,
            postComment: prev.postComment?.map((c) =>
              c._id === commentId
                ? {
                    ...c,
                    likedByUser,
                    likesCount, 
                  }
                : c
            ),
          }
        : prev
    );
  } catch (error) {
    console.error(error);
    toast.error("Failed to like comment");
  }
};

const handleDeleteComment=async(commentId:string,postId:string)=>{
   try {
     const response=await axiosInstance.delete(`comment/delete-comment/${commentId}`,{withCredentials:true})
   toast.success(response.data?.message || "Comment deleted");

    // 🧩 Update UI instantly
    setSelectedPost((prev) =>
      prev
        ? {
            ...prev,
            postComment: prev.postComment?.filter((c) => c._id !== commentId),
          }
        : prev
    );
    openPostModal(postId)
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    toast.error(error.response?.data?.message || "Failed to delete comment");
  }
}
  return (
    <div className="min-h-screen bg-neutral-100 flex relative">
      <Sidebar onCollapseChange={setIsCollapsed} />

      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[7rem]" : "ml-72"
        }`}
      >
<div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
  {posts.length === 0 ? (
    <p className="text-center text-gray-500 py-16">No posts to show</p>
  ) : (
    posts.map((post) => (
      <article
        key={post._id}
        className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src={
                post.postOwner.profilePhoto?
                post.postOwner.profilePhoto ||
                'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg':
                'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
              }
              className="w-10 h-10 rounded-full object-cover"
            />
            <h3 className="font-semibold text-gray-900 text-sm">
              <Link
                to={
                  post.postOwner._id === currentuserId
                    ? "/profile"
                    : `/profile/${post.postOwner._id}`
                }
              >
                {post.postOwner.username}
              </Link>
            </h3>
          </div>
        </header>

      {/* Carousel */}
{post.post.length > 0 && (
  <div className="relative overflow-hidden group rounded-2xl bg-black">
    <div className="w-full flex justify-center items-center max-h-[500px] overflow-hidden">
      <img
        src={post.post[post.activeIndex || 0]}
        alt="Post content"
        className="w-full h-auto max-h-[500px] object-contain transition-transform duration-500 group-hover:scale-[1.03]"
      />
    </div>

    {/* Carousel Arrows */}
    {post.post.length > 1 && (
      <>
        <button
          onClick={() => changePhoto(post._id, "prev")}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 text-gray-800 px-3 py-1.5 rounded-full hover:bg-white/50 hidden group-hover:block"
        >
          ‹
        </button>
        <button
          onClick={() => changePhoto(post._id, "next")}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 text-gray-800 px-3 py-1.5 rounded-full hover:bg-white/50 hidden group-hover:block"
        >
          ›
        </button>
      </>
    )}
  </div>
)}


        {/* Actions & Caption */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                onClick={() => toggleLike(post._id)}
                className={`transition-transform duration-200 hover:scale-110 ${
                  likedPosts.has(post._id)
                    ? "text-red-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Heart
                  size={24}
                  className={likedPosts.has(post._id) ? "fill-current" : ""}
                />
              </button>
              <MessageCircle
                onClick={() => openPostModal(post._id)}
                size={24}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              />
            </div>
           
          </div>

          <p className="font-semibold text-gray-900 text-sm">{post.likesCount} likes</p>

          {post.caption && (
            <p className="text-gray-900 text-sm line-clamp-2">
              <span className="font-semibold mr-1">{post.postOwner.username}</span>
              {post.caption}
            </p>
          )}
        </div>
      </article>
    ))
  )}
</div>

      </main>

      {/* 🧾 Modal for single post */}
{selectedPost && (
  <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-xl">

      {/* LEFT: Image Carousel */}
      <div className="relative bg-black flex items-center justify-center w-full md:w-1/2 h-[50vh] md:h-full overflow-hidden">
        <img
          src={selectedPost.post[selectedPost.activeIndex || 0]}
          alt="Post"
          className="object-contain max-h-full w-auto"
        />

        {selectedPost.post.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedPost((p) =>
                  p
                    ? {
                        ...p,
                        activeIndex:
                          (p.activeIndex! - 1 + p.post.length) % p.post.length,
                      }
                    : p
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setSelectedPost((p) =>
                  p
                    ? {
                        ...p,
                        activeIndex: (p.activeIndex! + 1) % p.post.length,
                      }
                    : p
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* RIGHT: Post Details */}
      <div className="flex flex-col justify-between w-full md:w-1/2">
       <div>
         {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={ selectedPost.postOwner.profilePhoto?
                selectedPost.postOwner.profilePhoto ||
               'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg':
              'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
              }
              alt="user"
              className="w-8 h-8 rounded-full"
            />
            <p className="font-semibold text-sm">
              {selectedPost.postOwner.username}
            </p>
          </div>
          <X
            size={22}
            className="cursor-pointer text-gray-600 hover:text-gray-800 transition"
            onClick={() => setSelectedPost(null)}
          />
        </div>

        {/* Caption + Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[55vh]">
          {/* Caption */}
          {selectedPost.caption && (
            <p className="flex gap-3 items-start">
              <img
                src={selectedPost.postOwner.profilePhoto}
                alt="profile"
                className="w-7 h-7 rounded-full"
              />
              <span className="text-sm">
                <span className="font-semibold mr-1">
                  {selectedPost.postOwner.username}
                </span>
                {selectedPost.caption}
              </span>
            </p>
          )}

          {/* Comments */}
       {(selectedPost.postComment || []).map((c) => (
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
              {c.likesCount} {c.likesCount === 0||c.likesCount === 1? "like" : "likes"}
            </span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {/* ❤️ Like Button */}
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
      {/* 🗑️ Delete Button (only for comment owner) */}
{c.commentOwner._id === localStorage.getItem("userid") && (
  <button
    onClick={() => handleDeleteComment(c._id,selectedPost._id)}
    className="text-gray-400 hover:text-red-500 transition-all duration-200 text-sm "
    title="Delete comment"
  >
  Delete
  </button>
)}

    </div>
  </div>
))}

       </div>
       </div>
       
        <div>
                   {/* Footer */}
        <div className="border-t border-gray-200 p-3 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{selectedPost.likesCount} likes</p>
              <p className="text-gray-500">
                {selectedPost.commentsCount} comments
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {formatTimeAgo(selectedPost.createdAt)} ago
            </p>
          </div>
        </div>

        {/* Add Comment */}
        {currentuserId !== selectedPost.postOwner._id && (
          <div className="border-t p-3 flex items-center gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={()=>handleAddComment(selectedPost._id)}
              className="text-blue-500 font-semibold text-sm"
            >
              Post
            </button>
          </div>
        )}
        </div>
     
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default Dashboard;


