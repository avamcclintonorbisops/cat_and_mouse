import { FC, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';

interface CatWithWavingPawProps {
  mousePosition: { x: number; y: number };
}

const CatWithWavingPaw: FC<CatWithWavingPawProps> = ({ mousePosition }) => {
  const [eyeRotation, setEyeRotation] = useState(0);
  const pawControls = useAnimation();

  useEffect(() => {
    // Calculate eye rotation based on mouse position
    const angle = Math.atan2(
      mousePosition.y - 0,
      mousePosition.x - 0
    ) * (180 / Math.PI);
    setEyeRotation(angle);
  }, [mousePosition]);

  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ rotate: 0 }}
      animate={{ rotate: 0 }}
    >
      {/* Cat shadow */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/10 rounded-full blur-sm"
        animate={{
          scale: [1, 0.95, 1],
          opacity: [0.1, 0.05, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="relative w-40 h-40">
        <Image
          src="/images/cat.png"
          alt="Cat"
          fill
          className="object-contain relative z-10"
          priority
          unoptimized
        />
        
        {/* Cat's eyes */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-4 h-4 bg-black rounded-full"
          style={{ rotate: eyeRotation }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-4 h-4 bg-black rounded-full"
          style={{ rotate: eyeRotation }}
        />
      </div>

      {/* Waving Paw */}
      <motion.div
        className="absolute top-1/2 right-0 w-8 h-8 origin-bottom"
        animate={{
          rotate: [0, 15, 0, 15, 0],
          scale: [1, 1.1, 1, 1.1, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-4 h-4 bg-black rounded-full" />
      </motion.div>
    </motion.div>
  );
};

export default CatWithWavingPaw; 