import { FC } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const MouseRunningInCircle: FC = () => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      {/* Mouse track */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-dashed border-gray-300/30" />
      
      {/* Mouse hole */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 bg-gray-800 rounded-t-full" />

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Mouse shadow */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 bg-black/10 rounded-full blur-sm"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="w-16 h-16 relative"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            rotate: -360
          }}
          animate={{
            y: [0, -2, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/images/mouse.png"
            alt="Mouse"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MouseRunningInCircle; 