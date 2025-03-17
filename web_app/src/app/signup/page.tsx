"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();

        // Dummy logic - In a real app, send data to backend
        console.log("User signed up:", { firstName, lastName, email, phone, password });
        router.push("/login"); // Redirect to login after signup
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#F8F3D9]">
            <div className="bg-white/30 p-10 rounded-[40px] shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-[#504B38] text-center">
                    Create an Account
                </h2>
                <p className="text-[#6B6651] text-center mt-2">
                    Enter your details to sign up
                </p>

                {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                <form onSubmit={handleSignup} className="space-y-4 mt-6">
                    <div>
                        <label className="block text-[#504B38]">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full p-2 border border-[#B9B28A] rounded mt-1 text-[#504B38] placeholder-[#8A8467] focus:ring-2 focus:ring-[#504B38]"
                            placeholder="Enter your first name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[#504B38]">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full p-2 border border-[#B9B28A] rounded mt-1 text-[#504B38] placeholder-[#8A8467] focus:ring-2 focus:ring-[#504B38]"
                            placeholder="Enter your last name"
                            required
                        />
                    </div>
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
                        <label className="block text-[#504B38]">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2 border border-[#B9B28A] rounded mt-1 text-[#504B38] placeholder-[#8A8467] focus:ring-2 focus:ring-[#504B38]"
                            placeholder="Enter your phone number"
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

                    <button
                        type="submit"
                        className="w-full bg-[#6B6651] text-white py-2 rounded-lg hover:bg-[#504B38] transition"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="text-[#504B38] text-center text-sm mt-4">
                    Already have an account?{" "}
                    <a href="/login" className="text-[#6B6651] font-semibold hover:underline">
                        Log In
                    </a>
                </p>
            </div>
        </div>
    );
}
