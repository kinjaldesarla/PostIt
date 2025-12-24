import React, { useState } from "react";
import { X, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";

interface CreatePostProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onClose, onSubmit }) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(selectedFiles);
      setPreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % previews.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + previews.length) % previews.length);
  };

  const handlePost = () => {
    if (images.length === 0) return;
    const formData = new FormData();
    images.forEach((file) => formData.append("post", file));
    formData.append("caption", caption);
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Create new post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={22} className="text-gray-600" />
          </button>
        </div>

        {/* Upload Section */}
        {previews.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <ImagePlus size={80} className="text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Drag photos here or click to select (Max 3)
            </p>
            <label className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg cursor-pointer hover:opacity-90 transition">
              Select from computer
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 h-[28rem]">
            {/* Carousel Preview */}
            <div className="relative flex items-center justify-center bg-black">
              <img
                src={previews[currentIndex]}
                alt="Preview"
                className="max-h-full object-contain"
              />

              {/* Navigation Arrows */}
              {previews.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 text-white bg-black bg-opacity-40 hover:bg-opacity-70 rounded-full p-2"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 text-white bg-black bg-opacity-40 hover:bg-opacity-70 rounded-full p-2"
                  >
                    <ChevronRight />
                  </button>
                </>
              )}

              {/* Small Dots Indicator */}
              {previews.length > 1 && (
                <div className="absolute bottom-3 flex gap-1">
                  {previews.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i === currentIndex ? "bg-white" : "bg-gray-400"
                      }`}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            {/* Caption Area */}
            <div className="flex flex-col p-4">
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full flex-1 border-none resize-none focus:ring-0 text-gray-800 text-sm"
              />
              <button
                onClick={handlePost}
                className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:opacity-90 transition"
              >
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;



