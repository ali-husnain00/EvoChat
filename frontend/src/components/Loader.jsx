import React from "react";
import { BsChatDots } from "react-icons/bs";

const Loader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <BsChatDots className="text-5xl animate-bounce text-blue-400" />
        <p className="text-xl font-semibold animate-pulse">Loading EvoChat...</p>
      </div>
    </div>
  );
};

export default Loader;
