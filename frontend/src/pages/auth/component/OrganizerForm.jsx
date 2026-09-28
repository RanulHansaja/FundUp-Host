import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUniversities, registerOrganizer } from "../../../services/authService";

export default function OrganizerForm() {
    const [representativeName, setRepresentativeName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [university, setUniversity] = useState("");
    const [clubName, setClubName] = useState("");
    const [approvalLetter, setApprovalLetter] = useState(null);
    const [studentIdImage, setStudentIdImage] = useState(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agree, setAgree] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const [universities, setUniversities] = useState([]);

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const response = await getUniversities();
                setUniversities(response.data);
            } catch (error) {
                console.error("Error fetching universities:", error);
            }
        };
        fetchUniversities();
    }, []);

    {/*filling out the university field based on the email domain*/ }

    useEffect(() => {
        if (!email || universities.length === 0) return;

        const trimmedEmail = email.trim().toLowerCase();
        const atIndex = trimmedEmail.lastIndexOf("@");

        if (atIndex === -1 || atIndex === trimmedEmail.length - 1) return;

        const emailDomain = trimmedEmail.slice(atIndex);
        const normalizedEmailDomain = emailDomain.startsWith("@") ? emailDomain : `@${emailDomain}`;

        const matchedUniversity = universities.find((uni) => {
            const universityDomain = (uni.domain || "").trim().toLowerCase();
            return universityDomain === normalizedEmailDomain || universityDomain === emailDomain;
        });

        if (matchedUniversity) {
            setUniversity(String(matchedUniversity.domainID));
        }
    }, [email, universities]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!representativeName || !email || !phone || !university || !clubName || !password || !confirmPassword) {
            setMessage("All text fields are required.");
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            setMessage("invalide phone number");
            return;
        }

        if (!approvalLetter || !studentIdImage) {
            setMessage("Both the approval letter and student ID image are required.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        if (!agree) {
            setMessage("You must agree to the Terms of Service and Privacy Policy.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("representativeName", representativeName);
            formData.append("email", email);
            formData.append("universityId", university);
            formData.append("clubName", clubName);
            formData.append("phone", phone);
            formData.append("approvalLetter", approvalLetter);
            formData.append("studentIdImage", studentIdImage);
            formData.append("password", password);
            formData.append("confirmPassword", confirmPassword);
            formData.append("role", "ORGANIZER");

            const response = await registerOrganizer(formData);

            if (response.data.success) {
                if (response.data.isVerified) {
                    navigate("/login", {
                        state: { successMessage: "You have been approved" }
                    });
                } else {
                    navigate("/", {
                        state: { warningMessage: "Approval is pending" }
                    });
                }
            } else {
                setMessage(response.data.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Organizer registration error:", error);
            setMessage("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
            onSubmit={handleSubmit}
        >
            {/* Representative Name */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                    Organizer Representative Name
                </label>
                <input
                    type="text"
                    placeholder="Representative Full Name"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                />
            </div>

            {/* Email Address */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                    Email Address
                </label>
                <input
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
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
                />
            </div>

            {/* University Selection */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                    University / Institution
                </label>
                <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
                >
                    <option value="">Select University</option>
                    {universities.map((uni) => (
                        <option key={uni.domainID} value={uni.domainID}>
                            {uni.universityName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Club Name */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                    Club / Society Name
                </label>
                <input
                    type="text"
                    placeholder="Rotaract Club"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-300"
                />
            </div>

            {/* Approval Letter File Input */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                    University Approval Letter (.pdf)
                </label>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setApprovalLetter(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-all border border-slate-200 rounded-xl p-2 bg-white focus:outline-none cursor-pointer"
                />
            </div>

            {/* Student ID Image File Input */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase block">
                    Club Head Student ID Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setStudentIdImage(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-all border border-slate-200 rounded-xl p-2 bg-white focus:outline-none cursor-pointer"
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
                />
            </div>

            {/* Checkbox Agreement Section */}
            <div className="md:col-span-2 mt-2">
                <label className="flex items-start gap-3 text-[12px] text-slate-500 leading-relaxed cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4 transition-all cursor-pointer"
                    />
                    <span>
                        I agree to the <a href="#" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>. I understand that all manual donations require slip approval for security.
                    </span>
                </label>
            </div>

            {/* Error/Success Messages */}
            {message && (
                <div className={`md:col-span-2 p-4 rounded-xl text-center text-sm font-semibold border ${message.toLowerCase().includes("wrong") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("required") || message.toLowerCase().includes("match") || message.toLowerCase().includes("must agree")
                    ? "bg-red-50 text-red-600 border-red-100"
                    : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                    {message}
                </div>
            )}

            {/* Submit Button */}
            <div className="md:col-span-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:bg-blue-400 disabled:cursor-not-allowed hover:shadow-xl cursor-pointer"
                >
                    {loading ? "Registering..." : "Create FundUp Account"}
                </button>
            </div>
        </form>
    );
}