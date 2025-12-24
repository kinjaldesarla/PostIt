import React, { useEffect, useState } from 'react';
import { Sidebar } from "../components/Sidebar"; 
import { Heart, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/AxiosInstances';
import { toast } from 'react-toastify';
import type { UserProfile } from '../types/User';
import type { Post } from '../types/PostComment';
import PostModal from '../components/PostModal';
import axios from 'axios';

type ProfileTab = 'posts' | 'saved';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    profile: {
      profilePhoto: "",
      username: "",
      fullname: "",
      bio: "",
      followers: [],
      following: [],
      savedPost: [],
      isPrivate:false,
    },
    posts: [],
    totalPost: 0,
  });
  const [profileTab, setProfileTab] = useState<ProfileTab>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [activeModal, setActiveModal] = useState<'followers' | 'following' | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();


  const updatePostInGrid = (updatedPost: any) => {
  setUser((prev) => ({
    ...prev,
    posts: prev.posts.map((p) =>
      p._id === updatedPost._id ? { ...p, ...updatedPost } : p
    ),
  }));
};

  const fetchUserProfile = async () => {
    try {
      const response = await axiosInstance.get('/user/profile', { withCredentials: true });
      setUser(response.data.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to fetch profile");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [updatePostInGrid]);

  // Handle removing/unfollowing users
  const handleFollowers = async (userId: string) => {
    try {
      if (activeModal === 'followers') {
        await axiosInstance.patch(`user/remove-follower/${userId}`, {}, { withCredentials: true });
        toast.success("Follower removed successfully");
      } else if (activeModal === 'following') {
        await axiosInstance.patch(`user/unfollow-user/${userId}`, {}, { withCredentials: true });
        toast.success("User unfollowed successfully");
      }
      fetchUserProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to remove/unfollow user");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };
  // Delete post
  const handleDeletePost = async (postId: string) => {
    try {
      const response = await axiosInstance.delete(`post/delete-post/${postId}`, { withCredentials: true });
      toast.success(response.data.message || "Post deleted successfully");
      setShowPostModal(false);
      fetchUserProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete post");
      } else {
        toast.error("Something went wrong while deleting.");
      }
    }
  };
  // Fetch single post details
  const getSinglePost = async (postId: string) => {
    try {
      const res = await axiosInstance.get(`post/post/${postId}`, { withCredentials: true });
      setSelectedPost({ ...res.data.data, activeIndex: 0 });
      setShowPostModal(true);
    } catch {
      toast.error("Failed to load post details");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar onCollapseChange={setIsCollapsed} />
        <main className="flex-1 ml-72">
          <div className="max-w-6xl mx-auto px-8 py-8">

            {/* Profile Header */}
            <section className="mb-12">
              <div className="flex items-start space-x-12 mb-8">
                <img
                  src={user.profile.profilePhoto? user.profile.profilePhoto || 'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg':'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-gray-100"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-6 mb-6">
                    <h1 className="text-2xl font-medium text-black">{user.profile.username}</h1>
                    <button
                      onClick={() => navigate('/edit-profile')}
                      className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-8 mb-4">
                    <div className="font-semibold text-gray-900">{user.totalPost} <span className="text-gray-600 text-sm">posts</span></div>
                    <button onClick={() => setActiveModal('followers')} className="font-semibold text-gray-900 hover:underline">{user.profile.followers.length} <span className="text-gray-600 text-sm">followers</span></button>
                    <button onClick={() => setActiveModal('following')} className="font-semibold text-gray-900 hover:underline">{user.profile.following.length} <span className="text-gray-600 text-sm">following</span></button>
                  </div>

                  {/* Bio */}
                  <div className="mt-4">
                    <div className="font-semibold text-gray-900">{user.profile.fullname}</div>
                    <div className="text-gray-600 ">{user.profile.bio}</div>
                  </div>
                </div>
              </div>
            </section>

         <section className="border-t border-gray-200">
              <nav className="flex justify-center space-x-16 -mb-px">
              </nav>
            </section>

            {/* Posts Grid */}
            <section className="mt-8">
              {profileTab === 'posts' && (
                <div className="grid grid-cols-3 gap-2">
                  {user.posts.map(post => (
                    <div key={post._id} onClick={() => getSinglePost(post._id)} className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden">
                      <img src={post.post[0]} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                      {(post.postLike.length >= 0|| post.postComment.length>=0) && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex items-center space-x-6 text-white">
                            <div className="flex items-center space-x-2"><Heart size={20} /><span className="font-semibold">{post.postLike.length}</span></div>
                            <div className="flex items-center space-x-2"><MessageCircle size={20} /><span className="font-semibold">{post.postComment.length}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
           
            </section>
          </div>
        </main>
      </div>

      {/* Post Modal */}
      {showPostModal && selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setShowPostModal(false)}
          refresh={fetchUserProfile}
         onUpdatePost={updatePostInGrid} 
         deletePost={handleDeletePost}
          currentUserId={localStorage.getItem("userid")!}
        />
      )}

      {/* Followers / Following Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-96 rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="font-semibold text-lg">{activeModal === 'followers' ? 'Followers' : 'Following'}</h2>
              <button onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(activeModal === 'followers' ? user.profile.followers : user.profile.following).map((u: any) => (
                <div key={u._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <img src={u.profilePhoto || 'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'} alt={u.username} className="w-10 h-10 rounded-full object-cover"/>
                    <span className="font-medium">{u.username}</span>
                  </div>
                  <button className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleFollowers(u._id)}>
                    {activeModal === "followers" ? "Remove" : "Unfollow"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;



