import React, { useState } from "react";

export default function Input({ className = "", onChange, ...props }) {
  const [isComposing, setIsComposing] = useState(false);

  const handleChange = (e) => {
    if (!isComposing) onChange?.(e);
  };

  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    onChange?.(e);
  };

  return (
    <input
      {...props}
      onChange={handleChange}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={handleCompositionEnd}
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm w-full ${className}`}
    />
  );
}
