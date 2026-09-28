import { useState } from "react";
import { registerDonor } from "../../../services/authService";

export default function DonorForm() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await registerDonor({
                fullName,
                email,
                phone,
                password,
                confirmPassword
            });

            setMessage(response.data.message);

            if (response.data.success) {
                setFullName("");
                setEmail("");
                setPhone("");
                setPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            setMessage("Something went wrong. Please try again.");
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Grid Layout for Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Full Name */}
                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                        Full Name
                    </label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                        required
                    />
                </div>

                {/* Email Address */}
                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                        Email Address
                    </label>
                    <input
                        type="email"
                        placeholder="name@university.domain"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                        required
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        placeholder="0771234567"
                        value={phone}
                        maxLength={10}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3.5 pr-16 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                            {showPassword ? "HIDE" : "SHOW"}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                        required
                    />
                </div>
            </div>

            {/* Error/Success Message Display */}
            {message && (
                <div className={`p-4 rounded-xl text-center text-sm font-semibold border ${message.toLowerCase().includes("wrong") || message.toLowerCase().includes("failed")
                    ? "bg-red-50 text-red-600 border-red-100"
                    : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                    {message}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:bg-blue-400 disabled:cursor-not-allowed hover:shadow-xl cursor-pointer"
            >
                {loading ? "Registering..." : "Create FundUp Account"}
            </button>
        </form>
    );
}