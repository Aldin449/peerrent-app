'use client';

import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';

interface Props {
  images: string[];
  title: string;
}

const ImageGallery = ({ images, title }: Props) => {
  const [index, setIndex] = useState(-1);
  console.log(images)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Slike</h2>
      <div className="grid grid-cols-1">
        {images && images.length > 0 && (
          <div  className="relative cursor-pointer" onClick={() => setIndex(0)}>
            <Image
              src={images[0]}
              alt={`${title} `}
              width={400}
              height={300}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          </div>
        )}
      </div>

      <Lightbox
        open={index !== -1}
        close={() => setIndex(-1)}
        index={index}
        slides={images.map((src) => ({ src }))}
      />
    </div>
  );
};

export default ImageGallery;
