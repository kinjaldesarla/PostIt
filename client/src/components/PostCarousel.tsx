import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PostCarouselProps {
  images: string[];
}

const PostCarousel: React.FC<PostCarouselProps> = ({ images }) => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={images[index]}
        alt="Post"
        className="max-h-full max-w-full object-contain"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 bg-black bg-opacity-40 hover:bg-opacity-70 text-white rounded-full p-2"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={next}
            className="absolute right-3 bg-black bg-opacity-40 hover:bg-opacity-70 text-white rounded-full p-2"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-3 flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === index ? "bg-white" : "bg-gray-500"
                }`}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PostCarousel;
