"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [currentTile, setCurrentTile] = useState(0);

  const tiles = [
    {
      text: "Track Parkinson’s Progress Effortlessly",
      subtext: "Our advanced digital platform allows doctors to monitor patient symptoms in real-time, using AI-driven insights and objective tracking tools."
    },
    {
      text: "AI-Powered Analysis for Better Care",
      subtext: "With our secure and HIPAA-compliant system, gain access to detailed reports, trends, and test scores to personalize patient treatment plans."
    },
    {
      text: "Seamless Remote Monitoring",
      subtext: "Reduce clinic visits while ensuring patients stay on track with their health. The system automatically updates patient data, providing real-time progress insights at your fingertips."
    }
  ];

  // Infinite scrolling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTile((prev) => (prev + 1) % tiles.length);
    }, 4000); // Change tile every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const getPosition = (index: number) => {
    if (index === currentTile) return "translate-x-0";
    if (index === (currentTile + 1) % tiles.length) return "translate-x-full";
    return "-translate-x-full";
  };

  return (
    <div className="h-screen flex justify-center items-center bg-[#EBE5C2] p-4">
      {/* Rectangle Container */}
      <div className="relative w-full h-[300px] sm:w-[500px] sm:h-[350px] md:w-[600px] md:h-[1000px] lg:w-[1350px] lg:h-[650px] bg-[#F8F3D9] backdrop-blur-sm p-10 rounded-[80px] shadow-lg flex flex-col items-center justify-center text-center">
        {/* Logo Section */}
        <img
          src="/logo/neuroTrack_logo.svg"
          alt="NeuroTrack Logo"
          className="w-[120px] h-auto mb-14x scale-180 overflow-hidden"
        />
        {/* Scrolling Content */}
        <div className="h-42 w-full max-w-[700px] mt-8 mb-4 mx-auto overflow-hidden relative">
          {tiles.map((tile, index) => (
            <div
              key={index}
              className={`absolute w-full p-2 transition-all duration-1000 ease-in-out 
                ${getPosition(index)} ${currentTile === index ? "opacity-100" : "opacity-0"}`}
            >
              <h1 className="text-4xl font-bold text-[#504B38] max-w-[700px] mx-auto">{tile.text}</h1>
              <p className="text-[#6B6651] mt-2 max-w-[400px] mx-auto">{tile.subtext}</p>
            </div>
          ))}
        </div>

        {/* Login Button */}
        <button
          onClick={() => router.push("/login")}
          className="mt-6 bg-[#6B6651] text-white py-3 px-6 rounded-lg hover:bg-[#504B38] transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
