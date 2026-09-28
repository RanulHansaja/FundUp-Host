import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../common/component/Navbar";
import DonorForm from "./component/DonorForm";
import OrganizerForm from "./component/OrganizerForm";
import logoImg from "../../assets/images/FundUp logo-CRF5i8gW.png";

export default function Register() {
    const [role, setRole] = useState("donor");
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gradient-to-tr from-blue-50/40 via-indigo-50/40 to-emerald-50/20 flex flex-col justify-center items-center px-4 py-24 relative overflow-hidden">
            {/* Top Navigation Bar */}
            <Navbar />

            {/* Background decorative blobs */}
            <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Central Card */}
            <div className="bg-white w-full max-w-3xl p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-blue-100/50 border border-slate-100/50 relative z-10">
                {/* Logo and Headings */}
                <div className="flex flex-col items-center text-center mb-8">
                    <img
                        src={logoImg}
                        alt="FundUp Logo"
                        className="h-14 w-auto object-contain mb-4 transition-transform hover:scale-105 duration-300"
                    />
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        Create your Account
                    </h2>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            state={location.state}
                            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* Role Tabs Selector */}
                <div className="flex p-1.5 bg-slate-100/70 rounded-2xl mb-8 border border-slate-200/20">
                    <button
                        onClick={() => setRole("donor")}
                        className={`flex-1 py-3 px-4 font-semibold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${role === "donor"
                            ? "bg-white text-blue-600 shadow-md shadow-slate-200/60"
                            : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                            }`}
                    >
                        🎁 Become a Donor
                    </button>

                    <button
                        onClick={() => setRole("organizer")}
                        className={`flex-1 py-3 px-4 font-semibold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${role === "organizer"
                            ? "bg-white text-blue-600 shadow-md shadow-slate-200/60"
                            : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                            }`}
                    >
                        🎓 Club Organizer
                    </button>
                </div>

                {/* Form fields component rendering */}
                <div className="transition-all duration-300">
                    {role === "donor" ? (
                        <DonorForm />
                    ) : (
                        <OrganizerForm />
                    )}
                </div>
            </div>
        </div>
    );
}