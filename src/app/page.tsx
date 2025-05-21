'use client';

import { FC } from 'react';
import CatAndMouse from '@/components/CatAndMouse';

const CatMousePlayground: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-yellow-400 flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 drop-shadow-lg mb-6 mt-4 text-center select-none">
        Cat and Mouse
      </h1>
      <div className="relative w-[1000px] h-[1000px] bg-white/90 rounded-2xl shadow-xl overflow-hidden">
        <CatAndMouse />
      </div>
    </div>
  );
};

export default CatMousePlayground;
