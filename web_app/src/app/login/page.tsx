"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doctorApi } from '@/services/api';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    // Video Ref to Control Playback
    const [isClient, setIsClient] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Ensure this runs only on the client (after hydration)
    useEffect(() => {
        setIsClient(true);

        // Auto-play video after hydration
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.error("Autoplay prevented:", error);
            });
        }
    }, []);

    // Handle video playback
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Only attempt to play if the document is visible
            if (document.visibilityState === 'visible') {
                const playVideo = async () => {
                    try {
                        await video.play();
                    } catch (error) {
                        console.log("Video autoplay failed:", error);
                    }
                };
                playVideo();
            }

            // Handle visibility changes
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    video.play().catch(e => console.log("Video play failed:", e));
                } else {
                    video.pause();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await doctorApi.login({ email, password });
            
            if (response.success) {
                // Store the token and doctor info
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('doctor_id', response.doctor_id);
                localStorage.setItem('doctor_email', response.email);
                
                // Redirect to dashboard
                router.push('/home');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const [currentTile, setCurrentTile] = useState(0);

    const tiles = [
        {
            video: "/login_assets/tile1.mp4",
            text: "Effortless Access, Detect Trends"
        },
        {
            video: "/login_assets/tile2.mp4",
            text: "Data-Driven Care for Smarter Decisions"
        },
        {
            video: "/login_assets/tile3.mp4",
            text: "Generate Detailed Reports"
        }
    ];

    // Auto-scroll tiles
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTile((prev) => {
                const nextTile = prev + 1;
                if (nextTile >= tiles.length) {
                    // When we reach the end, quickly reset to the first tile
                    setTimeout(() => {
                        setCurrentTile(0);
                    }, 500);
                    return prev;
                }
                return nextTile;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Top Side (Illustration for mobile, left for desktop) */}
            <div className="w-full md:w-1/2 bg-[#EBE5C2] flex items-center justify-center p-6">
                <div className="bg-[#F1ECD4] p-10 rounded-[40px] shadow-lg md:w-[550px] md:h-[650px] flex flex-col overflow-hidden relative">
                    {/* Tiles Container */}
                    <div className="h-full w-full flex transition-transform duration-500 ease-in-out relative overflow-hidden">
                        <div
                            className="h-full flex transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentTile * 100}%)`,
                                width: `${tiles.length * 100}%`
                            }}
                        >
                            {/* Render current, next, and previous tiles */}
                            {[...tiles, tiles[0]].map((tile, index) => (
                                <div
                                    key={index}
                                    className={`min-w-[100%] flex flex-col items-center`}
                                    style={{
                                        opacity: 1,
                                        transition: 'opacity 500ms ease-in-out'
                                    }}
                                >
                                    {/* Video Section - 75% of container height */}
                                    <div className="w-full h-[75%] flex justify-center items-center overflow-hidden">
                                        <video
                                            key={tile.video}
                                            className="w-full h-full object-cover rounded-lg shadow-lg transform scale-120 hover:scale-110 transition duration-300 ease-in-out translate-y-[7%]"
                                            muted
                                            loop
                                            playsInline
                                            autoPlay
                                        >
                                            <source src={tile.video} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>

                                    {/* Text Section - 25% of container height */}
                                    <div className="w-full h-[25%] flex justify-center items-center">
                                        <p className="text-[#504B38] text-center text-lg font-semibold">
                                            {tile.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {tiles.map((_, index) => (
                            <button
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentTile === index ? 'bg-[#504B38]' : 'bg-[#B9B28A]'
                                    }`}
                                onClick={() => setCurrentTile(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Side (Login Form for mobile, right for desktop) */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-[#F8F3D9] p-6">
                {/* Logo Section */}
                <img
                    src="/logo/neuroTrack_logo.svg"
                    alt="NeuroTrack Logo"
                    className="w-[80px] h-auto mb-4 scale-180 overflow-hidden"
                />
                <div className="bg-white/30 p-10 rounded-[40px] shadow-lg w-full max-w-sm md:w-96">
                    <h2 className="text-3xl font-bold text-[#504B38] text-center">
                        Welcome Back <br />
                    </h2>
                    <p className="text-[#6B6651] text-center mt-2">
                        Enter your email and password to access your account
                    </p>

                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                    <form onSubmit={handleLogin} className="space-y-4 mt-6">
                        <div>
                            <label className="block text-[#504B38]">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border border-[#B9B28A] rounded mt-1 text-[#504B38] placeholder-[#8A8467] focus:ring-2 focus:ring-[#504B38]"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[#504B38]">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-[#B9B28A] rounded mt-1 text-[#504B38] placeholder-[#8A8467] focus:ring-2 focus:ring-[#504B38]"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="flex justify-between items-center text-[12px]">
                            <a href="#" className="text-[#8A8467] hover:underline hover:text-[#504B38]">
                                Forgot Password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#6B6651] text-white py-2 rounded-lg hover:bg-[#504B38] transition"
                        >
                            Sign In
                        </button>
                    </form>

                    <p className="text-[#504B38] text-center text-sm mt-4">
                        Don't have an account?{" "}
                        <a href="/signup" className="text-[#6B6651] font-semibold hover:underline">
                            Sign Up
                        </a>
                    </p>

                </div>
            </div>
        </div>
    );
}
