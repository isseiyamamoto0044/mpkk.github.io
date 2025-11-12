import React from "react";

export default function Input(props) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
        props.className || ""
      }`}
    />
  );
}
