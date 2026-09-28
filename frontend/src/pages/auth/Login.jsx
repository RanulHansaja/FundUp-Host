import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, CheckCircle2, X, Eye, EyeOff, Globe, Camera } from "lucide-react";
import { login } from "../../services/authService";
import Navbar from "../common/component/Navbar";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);
    const { login: contextLogin } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const successMessage = location.state?.successMessage;
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setToast({
                type: "success",
                message: successMessage
            });
        }, 0);

        navigate(location.pathname, { replace: true, state: {} });
        return () => clearTimeout(timer);
    }, [location, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await login({ email, password });
            const data = response.data;

            if (!data.success) {
                setError(data.message || "Invalid credentials");
                return;
            }

            contextLogin({
                userID: data.userID,
                fullName: data.fullName,
                email: data.email,
                role: data.role,
                verificationStatus: data.verificationStatus,
                profilePhoto: data.profilePhoto || null
            });

            const role = data.role?.toUpperCase();
            const redirectPath = location.state?.from || location.state?.redirect;

            if (redirectPath) {
                const redirectState = location.state?.shareStory ? { shareStory: true } : undefined;
                navigate(redirectPath, { state: redirectState });
            } else if (role === "DONOR") {
                navigate("/donor-dashboard");
            } else if (role === "ORGANIZER") {
                navigate("/organizer-dashboard");
            } else if (role === "ADMIN") {
                navigate("/admin-dashboard");
            } else {
                setError("Unable to determine user role.");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Login failed. Please try again.");
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
                        <p className="font-bold text-sm">Approved!</p>
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
            <div className="z-10 relative flex md:flex-row flex-col bg-white shadow-2xl shadow-blue-100/50 border border-slate-100/50 rounded-[2rem] w-full max-w-5xl md:max-h-[82vh] overflow-hidden transition-all duration-300">
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

                {/* Right Side: Login Form */}
                <div className="flex flex-col flex-1 justify-between bg-white p-8 md:p-12">
                    <div className="space-y-6 mx-auto my-auto w-full max-w-md">
                        <div>
                            <h2 className="font-extrabold text-slate-800 text-3xl tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="mt-1.5 font-medium text-slate-500 text-sm">
                                Access your dashboard to manage contributions and campaigns.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-2xl text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block mb-2 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <span className="left-0 absolute inset-y-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                                        <Mail className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white py-3.5 pr-4 pl-10 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-full font-medium text-slate-700 text-sm transition-all placeholder-slate-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                                        Password
                                    </label>

                                </div>
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

                            <Link to="/forgot-password" className="block mb-5 font-semibold text-blue-600 text-xs hover:underline pl-85">
                                Forgot password?
                            </Link>

                            {/* Sign In Button */}
                            <button
                                type="submit"
                                className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg hover:shadow-xl py-4 rounded-xl w-full font-semibold text-white text-sm active:scale-[0.99] transition-all cursor-pointer"
                            >
                                Sign In to Account
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex justify-center items-center my-4">
                            <div className="absolute inset-x-0 bg-slate-200 h-px" />
                            <span className="relative bg-white px-3 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                                connect with us
                            </span>
                        </div>

                        {/* Social SSO login */}
                        <div className="gap-4 grid grid-cols-2">
                            <a
                                href="https://www.facebook.com"
                                target="_blank"
                                rel="noreferrer"
                                className="flex justify-center items-center gap-2 bg-white hover:bg-slate-50 py-3 border border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-slate-700 text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
                            >
                                <Globe className="w-4 h-4 text-blue-600" />
                                Facebook
                            </a>
                            <a
                                href="https://www.instagram.com"
                                target="_blank"
                                rel="noreferrer"
                                className="flex justify-center items-center gap-2 bg-white hover:bg-slate-50 py-3 border border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-slate-700 text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
                            >
                                <Camera className="w-4 h-4 text-pink-500" />
                                Instagram
                            </a>
                        </div>

                        {/* Don't have an account */}
                        <div className="mt-6 font-medium text-slate-500 text-sm text-center">
                            Don't have an account?{" "}
                            <Link to="/register" state={location.state} className="font-semibold text-blue-600 hover:underline">
                                register your interest
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
