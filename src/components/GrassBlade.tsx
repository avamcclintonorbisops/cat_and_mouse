import { FC } from 'react';
import { motion } from 'framer-motion';

interface GrassBladeProps {
  index: number;
  total: number;
}

const GrassBlade: FC<GrassBladeProps> = ({ index, total }) => {
  const delay = index * 0.2;
  const rotation = Math.random() * 20 - 10;
  const height = 16 + Math.random() * 8;

  return (
    <motion.div
      className="absolute bottom-0 bg-gradient-to-t from-green-600 to-green-400"
      style={{
        left: `${(index / total) * 100}%`,
        width: '2px',
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'bottom',
      }}
      animate={{
        height: [height, height + 4, height],
        rotate: [rotation, rotation + 5, rotation],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
};

export default GrassBlade; 