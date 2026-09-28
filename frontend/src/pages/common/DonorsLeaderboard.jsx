import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Medal, Shield, Star, Search, ArrowLeft } from "lucide-react";
import Navbar from "./component/Navbar";
import trophyImg from "../../assets/images/gold_trophy.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

function DonorsLeaderboard() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState("ALL");

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDonors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/public/getTopDonors.php?all=true`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setDonors(result.data);
        } else {
          setError(result.message || "Failed to load donors leaderboard.");
        }
      } catch (err) {
        console.error("Error fetching leaderboard donors:", err);
        setError("Network error while loading donors leaderboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, []);

  const getAvatarUrl = (profilePhoto, fullName) => {
    if (profilePhoto) {
      if (profilePhoto.startsWith("http")) return profilePhoto;
      return `${BACKEND_URL}/${profilePhoto.replace(/^\//, "")}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "Donor")}&background=004bd6&color=fff&bold=true`;
  };

  const renderBadgeIcon = (level, sizeClasses = "w-4 h-4") => {
    const lvl = level ? level.toUpperCase() : "NONE";
    switch (lvl) {
      case "PLATINUM":
        return <Award className={`${sizeClasses} text-indigo-600 shrink-0`} />;
      case "GOLD":
        return <img src={trophyImg} alt="Gold Trophy" className={`${sizeClasses} object-contain shrink-0`} />;
      case "SILVER":
        return <Medal className={`${sizeClasses} text-slate-500 shrink-0`} />;
      case "BRONZE":
        return <Shield className={`${sizeClasses} text-orange-600 shrink-0`} />;
      case "STARTER":
        return <Star className={`${sizeClasses} text-blue-600 shrink-0`} />;
      default:
        return (
          <svg className={`${sizeClasses} text-slate-300 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        );
    }
  };

  const getBadgePillStyles = (level) => {
    const lvl = level ? level.toUpperCase() : "NONE";
    switch (lvl) {
      case "PLATINUM":
        return {
          label: "Platinum",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-sm shadow-indigo-100",
        };
      case "GOLD":
        return {
          label: "Gold",
          bg: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-sm shadow-amber-100",
        };
      case "SILVER":
        return {
          label: "Silver",
          bg: "bg-slate-100 text-slate-700 border-slate-300/80 shadow-sm shadow-slate-100",
        };
      case "BRONZE":
        return {
          label: "Bronze",
          bg: "bg-orange-50 text-orange-700 border-orange-200/80 shadow-sm shadow-orange-100",
        };
      case "STARTER":
        return {
          label: "Starter",
          bg: "bg-blue-50 text-blue-700 border-blue-200/80 shadow-sm shadow-blue-100",
        };
      default:
        return {
          label: "Member",
          bg: "bg-slate-50 text-slate-500 border-slate-200",
        };
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (d.fullName && d.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.affiliation && d.affiliation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBadge =
      selectedBadgeFilter === "ALL" ||
      (d.badgeLevel && d.badgeLevel.toUpperCase() === selectedBadgeFilter);

    return matchesSearch && matchesBadge;
  });

  return (
    <div className="flex flex-col bg-slate-50 selection:bg-blue-500 min-h-screen font-sans selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <div className="relative bg-white pt-22 sm:pt-24 pb-12 border-slate-200/60 border-b overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="top-1/2 left-1/2 absolute bg-blue-500/5 blur-[120px] rounded-full w-[700px] h-[350px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative space-y-4 mx-auto px-6 lg:px-8 max-w-7xl text-center">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 mb-2 px-4 py-2 rounded-full font-bold text-slate-700 text-xs transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>

          <div>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 px-4 py-1.5 border border-blue-100 rounded-full font-black text-[10px] text-blue-700 uppercase tracking-widest">
              🏆 Community Leaderboard
            </span>
          </div>

          <h1 className="font-black text-slate-900 text-3xl sm:text-5xl tracking-tight">
            Donors Recognition & Leaderboard
          </h1>

          <p className="mx-auto max-w-2xl font-medium text-slate-500 text-sm sm:text-base leading-relaxed">
            Honoring every generous philanthropist, alumnus, and backer driving real impact across university initiatives.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 space-y-10 mx-auto px-6 lg:px-8 py-12 w-full max-w-7xl">
        
        {/* Top 3 Podium Highlights */}
        {!loading && donors.length >= 3 && (
          <div className="items-end gap-6 grid md:grid-cols-3 mx-auto max-w-5xl">
            {/* 2nd Place */}
            {donors[1] && (
              <div className="relative flex flex-col items-center space-y-3 order-2 md:order-1 bg-white shadow-md hover:shadow-lg p-6 border border-slate-200/80 rounded-3xl text-center transition-all">
                <div className="-top-3 absolute bg-slate-500 shadow-sm px-3 py-1 rounded-full font-black text-[10px] text-white uppercase tracking-wider">
                  🥈 2nd Place
                </div>
                <img
                  src={getAvatarUrl(donors[1].profilePhoto, donors[1].fullName)}
                  alt={donors[1].fullName}
                  className="mt-2 rounded-full ring-4 ring-slate-100 w-20 h-20 object-cover"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{donors[1].fullName}</h3>
                  <p className="font-semibold text-slate-400 text-xs">{donors[1].affiliation || "Donor"}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-slate-100 border-t w-full text-xs">
                  <span className="font-bold text-slate-400">Total Contribution</span>
                  <span className="font-black text-slate-800 text-sm">Rs. {Number(donors[1].totalDonation).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {donors[0] && (
              <div className="relative flex flex-col items-center space-y-4 order-1 md:order-2 bg-gradient-to-b from-blue-50/50 via-white to-white shadow-xl hover:shadow-2xl p-8 border-2 border-blue-200 rounded-3xl text-center transition-all -translate-y-2">
                <div className="-top-4 absolute bg-blue-600 shadow-md px-4 py-1.5 rounded-full font-black text-[10px] text-white uppercase tracking-widest">
                  👑 1st Place
                </div>
                <img
                  src={getAvatarUrl(donors[0].profilePhoto, donors[0].fullName)}
                  alt={donors[0].fullName}
                  className="mt-2 rounded-full ring-8 ring-blue-100 w-24 h-24 object-cover"
                />
                <div>
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl">{donors[0].fullName}</h3>
                  <p className="font-semibold text-slate-500 text-xs">{donors[0].affiliation || "Philanthropic Leader"}</p>
                </div>
                <div className="flex flex-col items-center pt-3 border-blue-100 border-t w-full">
                  <span className="font-black text-[10px] text-blue-600 uppercase tracking-widest">Lifetime Impact</span>
                  <span className="font-black text-blue-600 text-xl sm:text-2xl">Rs. {Number(donors[0].totalDonation).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {donors[2] && (
              <div className="relative flex flex-col items-center space-y-3 order-3 md:order-3 bg-white shadow-md hover:shadow-lg p-6 border border-slate-200/80 rounded-3xl text-center transition-all">
                <div className="-top-3 absolute bg-amber-600 shadow-sm px-3 py-1 rounded-full font-black text-[10px] text-white uppercase tracking-wider">
                  🥉 3rd Place
                </div>
                <img
                  src={getAvatarUrl(donors[2].profilePhoto, donors[2].fullName)}
                  alt={donors[2].fullName}
                  className="mt-2 rounded-full ring-4 ring-amber-50 w-20 h-20 object-cover"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{donors[2].fullName}</h3>
                  <p className="font-semibold text-slate-400 text-xs">{donors[2].affiliation || "Donor"}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-slate-100 border-t w-full text-xs">
                  <span className="font-bold text-slate-400">Total Contribution</span>
                  <span className="font-black text-slate-800 text-sm">Rs. {Number(donors[2].totalDonation).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="space-y-4 bg-white shadow-sm p-6 border border-slate-200/80 rounded-3xl">
          <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="top-3.5 left-4 absolute w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search donor by name or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 focus:bg-white py-3 pr-4 pl-11 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-semibold text-slate-800 text-xs sm:text-sm transition-all placeholder-slate-400"
              />
            </div>

            {/* Badge Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["ALL", "PLATINUM", "GOLD", "SILVER", "BRONZE", "STARTER"].map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedBadgeFilter(b);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    selectedBadgeFilter === b
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {b === "ALL" ? "All Donors" : b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Donors Leaderboard List - Min-height prevents layout shifts/jumps */}
        <div className="bg-white shadow-sm border border-slate-200/80 rounded-3xl min-h-[420px] overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full w-10 h-10 animate-spin" />
              <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Loading ranked donors...</p>
            </div>
          ) : error ? (
            <div className="py-16 font-bold text-red-500 text-sm text-center">
              {error}
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="py-20 font-semibold text-slate-400 text-sm text-center">
              No donors found matching your search criteria.
            </div>
          ) : (
            <div>
              {/* Table Header Bar */}
              <div className="hidden sm:grid grid-cols-12 items-center px-8 py-3.5 bg-slate-50/90 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest select-none">
                <div className="col-span-6">Rank & Donor Profile</div>
                <div className="col-span-3 text-center">Contributor Badge</div>
                <div className="col-span-3 text-right">Total Contribution</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredDonors.map((donor, index) => {
                  const rank = index + 1;
                  const badgeStyle = getBadgePillStyles(donor.badgeLevel);

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 hover:bg-slate-50/80 p-5 sm:px-8 transition-colors"
                    >
                      {/* Column 1: Rank & Donor Profile (Cols 1-6) */}
                      <div className="sm:col-span-6 flex items-center gap-4 sm:gap-5">
                        {/* Rank Indicator */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                            rank === 1
                              ? "bg-amber-400 text-white shadow-md shadow-amber-200"
                              : rank === 2
                              ? "bg-slate-400 text-white shadow-md shadow-slate-200"
                              : rank === 3
                              ? "bg-amber-600 text-white shadow-md shadow-amber-200"
                              : "bg-slate-100 text-slate-600 font-bold"
                          }`}
                        >
                          #{rank}
                        </div>

                        {/* Avatar */}
                        <img
                          src={getAvatarUrl(donor.profilePhoto, donor.fullName)}
                          alt={donor.fullName}
                          className="rounded-full ring-2 ring-slate-100 w-12 h-12 object-cover shrink-0"
                        />

                        {/* Name & Bio */}
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                            {donor.fullName}
                          </h4>
                          <p className="font-medium text-slate-400 text-xs">
                            {donor.affiliation || "Philanthropic Backer"}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Contributor Badge (Cols 7-9) */}
                      <div className="sm:col-span-3 flex items-center sm:justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${badgeStyle.bg}`}
                        >
                          {renderBadgeIcon(donor.badgeLevel, "w-3.5 h-3.5")}
                          {badgeStyle.label}
                        </span>
                      </div>

                      {/* Column 3: Total Contribution (Cols 10-12) */}
                      <div className="sm:col-span-3 text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="block sm:hidden font-black text-[9px] text-slate-400 uppercase tracking-widest">
                          Total Contribution
                        </span>
                        <span className="block font-black text-blue-600 text-base sm:text-lg">
                          Rs. {Number(donor.totalDonation).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DonorsLeaderboard;
