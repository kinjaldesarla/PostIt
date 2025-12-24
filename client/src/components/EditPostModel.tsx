import React, { useState } from "react";
import { X } from "lucide-react";
import axiosInstance from "../utils/AxiosInstances";
import { toast } from "react-toastify";

interface EditPostModalProps {
  postId: string;
  currentCaption: string;
  onClose: () => void;
  onUpdate: () => void; // to refresh posts after update
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  postId,
  currentCaption,
  onClose,
  onUpdate,
}) => {
  const [caption, setCaption] = useState(currentCaption);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch(
        `post/update-caption/${postId}`,
        { caption },
        { withCredentials: true }
      );

      toast.success(response.data.message || "Post updated successfully");
      onUpdate(); // refresh posts
      onClose(); // close modal
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[400px] p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-gray-900">
          Edit Caption
        </h2>

        {/* Caption input */}
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none resize-none text-gray-800"
          rows={4}
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium text-white ${
              loading
                ? "bg-pink-400 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600"
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
