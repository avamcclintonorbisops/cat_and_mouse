import { FC } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCloudProps {
  className?: string;
  delay?: number;
}

const AnimatedCloud: FC<AnimatedCloudProps> = ({ className = '', delay = 0 }) => {
  return (
    <motion.div
      className={`absolute bg-white/30 rounded-full ${className}`}
      animate={{
        x: [0, 20, 0],
        opacity: [0.7, 0.9, 0.7],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
};

export default AnimatedCloud; 