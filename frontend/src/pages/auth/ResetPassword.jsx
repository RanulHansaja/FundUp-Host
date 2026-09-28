import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle2, X, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../services/authService";
import Navbar from "../common/component/Navbar";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setToast(null);

        if (!token) {
            setError("Invalid request. The reset token is missing.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await resetPassword({ token, password, confirmPassword });
            const data = response.data;

            if (!data.success) {
                setError(data.message || "An error occurred. Please try again.");
            } else {
                setToast({
                    type: "success",
                    message: data.message
                });
                setIsSuccess(true);
                setPassword("");
                setConfirmPassword("");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col justify-center items-center bg-gradient-to-tr from-blue-50/40 via-indigo-50/40 to-emerald-50/20 px-4 py-24 md:py-0 md:pt-16 min-h-screen md:h-screen overflow-hidden font-sans text-slate-800 antialiased">
            {/* Top Navigation Bar */}
            <Navbar />

            {/* Background decorative blobs */}
            <div className="top-1/4 left-10 absolute bg-blue-200/30 blur-3xl rounded-full w-72 h-72 animate-pulse duration-[6000ms] pointer-events-none"></div>
            <div className="right-10 bottom-1/4 absolute bg-emerald-200/20 blur-3xl rounded-full w-80 h-80 animate-pulse duration-[8000ms] pointer-events-none"></div>

            {/* Success Toast / Popup */}
            {toast && (
                <div className="top-5 right-5 z-50 fixed flex items-center gap-3 bg-emerald-50 shadow-xl px-5 py-4 border border-emerald-200 rounded-xl text-emerald-800 animate-bounce">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Success!</p>
                        <p className="text-emerald-700 text-xs">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-3 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Centered Split-Screen Card */}
            <div className="z-10 relative flex md:flex-row flex-col bg-white shadow-2xl shadow-blue-100/50 border border-slate-100/50 rounded-[2rem] w-full max-w-5xl overflow-hidden transition-all duration-300">
                {/* Left Side: Brand Banner */}
                <div className="relative flex flex-col justify-center bg-gradient-to-b from-blue-600 to-indigo-700 p-8 md:p-12 md:w-[42%] min-h-[350px] md:min-h-[500px] overflow-hidden text-white">
                    {/* Background image overlay with blue tint */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200')`
                        }}
                    />

                    {/* Slogan */}
                    <div className="z-10 relative max-w-sm">
                        <h1 className="font-bold text-3xl md:text-4xl leading-tight tracking-tight">
                            Empowering the next generation of excellence.
                        </h1>
                        <p className="opacity-90 mt-4 text-blue-100 text-sm md:text-base leading-relaxed">
                            Join thousands of alumni and donors in supporting university-led innovation, scholarships, and campus growth. Your contribution shapes the future.
                        </p>

                        {/* Active Partners */}
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md mt-6 p-3 border border-white/15 rounded-xl w-fit">
                            <div className="flex -space-x-1.5">
                                <img className="border-2 border-indigo-600 rounded-full w-7 h-7" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80" alt="Partner 1" />
                                <img className="border-2 border-indigo-600 rounded-full w-7 h-7" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="Partner 2" />
                                <img className="border-2 border-indigo-600 rounded-full w-7 h-7" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80" alt="Partner 3" />
                                <div className="flex justify-center items-center bg-cyan-400 border-2 border-indigo-600 rounded-full w-7 h-7 font-bold text-[10px] text-indigo-900">+2k</div>
                            </div>
                            <span className="font-semibold text-[10px] text-blue-100">Active University Partners</span>
                        </div>
                    </div>

                    {/* Footer Copy */}
                    <div className="bottom-6 left-8 md:left-12 z-10 absolute opacity-80 text-[10px] text-blue-200">
                        © 2024 FundUp University Platform. All rights reserved.
                    </div>
                </div>

                {/* Right Side: Reset Password Form */}
                <div className="flex flex-col flex-1 justify-between bg-white p-8 md:p-12">
                    <div className="space-y-6 mx-auto my-auto w-full max-w-md">
                        <div>
                            <h2 className="font-extrabold text-slate-800 text-3xl tracking-tight">
                                Reset Password
                            </h2>
                            <p className="mt-1.5 font-medium text-slate-500 text-sm">
                                Enter and confirm your new password below.
                            </p>
                        </div>

                        {!token && (
                            <div className="bg-red-50 p-4 border border-red-200 rounded-2xl text-red-700 text-sm">
                                Invalid reset request. A valid token is required. Please check your email and click the link again.
                            </div>
                        )}

                        {token && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-2xl text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                {isSuccess ? (
                                    <div className="space-y-4">
                                        <div className="bg-emerald-50 px-4 py-3 border border-emerald-200 rounded-2xl text-emerald-800 text-sm">
                                            Password reset successful! You can now log in using your new credentials.
                                        </div>
                                        <Link
                                            to="/login"
                                            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg hover:shadow-xl mt-4 py-4 rounded-xl w-full font-semibold text-white text-sm active:scale-[0.99] transition-all cursor-pointer text-center"
                                        >
                                            Go to Sign In
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block mb-2 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <span className="left-0 absolute inset-y-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                                                    <Lock className="w-4 h-4" />
                                                </span>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-white py-3.5 pr-10 pl-10 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-full font-medium text-slate-700 text-sm transition-all placeholder-slate-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="right-0 absolute inset-y-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <span className="left-0 absolute inset-y-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                                                    <Lock className="w-4 h-4" />
                                                </span>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="bg-white py-3.5 pr-10 pl-10 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-full font-medium text-slate-700 text-sm transition-all placeholder-slate-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="right-0 absolute inset-y-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reset Button */}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-blue-500/20 shadow-lg hover:shadow-xl mt-2 py-4 rounded-xl w-full font-semibold text-white text-sm active:scale-[0.99] transition-all cursor-pointer"
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Updating...
                                                </span>
                                            ) : (
                                                <>
                                                    Reset Password
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </form>
                        )}

                        {/* Back to Sign In (if not success state) */}
                        {!isSuccess && (
                            <div className="mt-8 font-medium text-slate-500 text-sm text-center">
                                Back to{" "}
                                <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Bottom navigation links */}
                    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-12 font-semibold text-slate-400 text-xs">
                        <a href="#" className="hover:text-slate-600 transition">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-600 transition">Terms of Service</a>
                        <a href="#" className="hover:text-slate-600 transition">University Affiliates</a>
                        <a href="#" className="hover:text-slate-600 transition">Support</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
