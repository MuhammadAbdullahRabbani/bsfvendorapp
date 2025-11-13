import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      {/* Spinner */}
      <div
        className="w-16 h-16 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin"
        style={{ borderRadius: "50%" }}
      ></div>

      {/* Text */}
      <p className="text-lg font-bold font-[Poppins] text-white-500">
        Loading....
      </p>
    </div>
  );
}
