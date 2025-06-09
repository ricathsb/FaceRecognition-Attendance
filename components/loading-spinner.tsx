"use client";

import { motion } from "framer-motion";

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center"
      >
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-blue-200 rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
            className="absolute inset-0 border-4 border-t-blue-600 rounded-full"
          />
        </div>
        <p className="mt-4 text-gray-700 font-medium">Processing...</p>
        <p className="text-sm text-gray-500 mt-1">Identifying </p>
      </motion.div>
    </div>
  );
}