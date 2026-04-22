"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

interface ImageData {
  src: string;
  alt: string;
  id: string;
}

interface ImageStackProps {
  images?: ImageData[];
  seed?: number;
  className?: string;
}

const fomosapiensImages: ImageData[] = [
  { id: "1",  src: "/fomosapiens-1.jpg",  alt: "" },
  { id: "2",  src: "/fomosapiens-2.jpg",  alt: "" },
  { id: "3",  src: "/fomosapiens-3.jpg",  alt: "" },
  { id: "4",  src: "/fomosapiens-4.jpg",  alt: "" },
  { id: "5",  src: "/fomosapiens-5.jpg",  alt: "" },
  { id: "6",  src: "/fomosapiens-6.jpg",  alt: "" },
  { id: "7",  src: "/fomosapiens-7.jpg",  alt: "" },
  { id: "8",  src: "/fomosapiens-8.jpg",  alt: "" },
  { id: "9",  src: "/fomosapiens-9.jpg",  alt: "" },
  { id: "10", src: "/fomosapiens-10.jpg", alt: "" },
  { id: "11", src: "/fomosapiens-11.jpg", alt: "" },
];

const ImageStack = ({ images = fomosapiensImages, seed = 12345, className = "" }: ImageStackProps) => {
  const n = images.length;
  const [topIndex, setTopIndex] = React.useState(0);
  const [flickingIndex, setFlickingIndex] = React.useState<number | null>(null);
  // Incrementing a card's remount key triggers its return-to-back animation
  const [remountKeys, setRemountKeys] = React.useState<number[]>(() => images.map(() => 0));
  const prefersReducedMotion = useReducedMotion();

  const stackRotations = React.useMemo(() => {
    const rng = new SeededRandom(seed);
    return images.map(() => rng.range(-8, 8));
  }, [seed, images]);

  const spring = prefersReducedMotion
    ? { type: "tween" as const, duration: 0.2 }
    : { type: "spring" as const, stiffness: 260, damping: 22 };

  const flickSpring = prefersReducedMotion
    ? { type: "tween" as const, duration: 0.25 }
    : { type: "spring" as const, stiffness: 220, damping: 26 };

  const returnSpring = prefersReducedMotion
    ? { type: "tween" as const, duration: 0.35 }
    : { type: "spring" as const, stiffness: 160, damping: 28 };

  const handleClick = () => {
    if (flickingIndex !== null) return;
    setFlickingIndex(topIndex);
  };

  const handleFlickComplete = (cardIndex: number) => {
    if (cardIndex !== flickingIndex) return;
    // Remount this card so it starts from off-screen left and slides into the back
    setRemountKeys(prev => {
      const next = [...prev];
      next[cardIndex] = next[cardIndex] + 1;
      return next;
    });
    setTopIndex(t => (t + 1) % n);
    setFlickingIndex(null);
  };

  return (
    <div className={`relative w-full h-[600px] flex items-center justify-center overflow-hidden ${className}`}>
      <div className="relative" style={{ width: 352, height: 495 }}>
        {images.map((image, cardIndex) => {
          const stackPos = (cardIndex - topIndex + n) % n;
          const isTop = stackPos === 0;
          const isFlicking = flickingIndex === cardIndex;
          const remountKey = remountKeys[cardIndex];

          return (
            <motion.div
              // remountKey changes after a flick, triggering the return-to-back animation
              key={`${image.id}-${remountKey}`}
              className="absolute inset-0"
              style={{ zIndex: n - stackPos }}
              // On remount (return): start off-screen left at back-of-stack depth
              initial={remountKey > 0
                ? {
                    x: -700,
                    y: (n - 1) * 3,
                    rotate: stackRotations[cardIndex] - 10,
                    scale: 1 - (n - 1) * 0.01,
                  }
                : false
              }
              animate={
                isFlicking
                  ? { x: -900, y: 0, rotate: stackRotations[cardIndex] - 15, scale: 1 }
                  : {
                      x: stackPos * 2,
                      y: stackPos * 3,
                      rotate: stackRotations[cardIndex],
                      scale: 1 - stackPos * 0.01,
                    }
              }
              transition={isFlicking ? flickSpring : remountKey > 0 && stackPos === n - 1 ? returnSpring : spring}
              onAnimationComplete={() => isFlicking && handleFlickComplete(cardIndex)}
              onClick={isTop ? handleClick : undefined}
              whileHover={isTop && flickingIndex === null ? { scale: 1.03 } : {}}
              whileTap={isTop && flickingIndex === null ? { scale: 0.97 } : {}}
            >
              <div className={`bg-white p-6 shadow-xl border rounded-sm select-none ${isTop ? "cursor-pointer" : "cursor-default"}`}>
                <img
                  src={image.src}
                  alt=""
                  className="w-[352px] h-[422px] object-cover rounded-sm pointer-events-none"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='384'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E";
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="absolute bottom-8 text-xs text-gray-400">
        Click the photo to flick through
      </p>
    </div>
  );
};

const ImageStackDemo = () => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center">
    {/* top half — logo sits vertically centered here */}
    <div className="flex-1 flex items-center justify-center w-full">
      <img
        src="/logo.png"
        alt="fomosapiens"
        className="h-16 w-auto object-contain"
      />
    </div>
    {/* bottom half — stack sits vertically centered here */}
    <div className="flex-1 flex items-center justify-center w-full">
      <ImageStack />
    </div>
  </div>
);

export default ImageStackDemo;
