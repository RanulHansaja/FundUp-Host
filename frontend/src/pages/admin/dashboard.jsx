import { useState, useEffect } from "react";
import Sidebar from "./component/sidebar";
import { Users, UserCheck, TrendingUp, AlertCircle, Database, Handshake, Coins, Flag } from "lucide-react";
import { getAdminDashboardData } from "../../services/authService";

//useState is a React hook that lets a component remember and store data.
// stats — to read the current value
// setStats — to update the value
function Dashboard() {
    const [stats, setStats] = useState({
        activeOrganizers: 0,
        activeDonors: 0,
        totalProjects: 0,
        totalUsers: 0,
        totalFundsRaised: 0,
        totalDonations: 0,
        averageDonation: 0,
        successfulCampaigns: 0,
        fundsRaisedByCategory: []
    });
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await getAdminDashboardData(); //calls auth service to get dashboard data from backend
                if (response.data.success) {
                    setStats(response.data.data);  // ← saves all stats to state
                    setWeeklyData(response.data.data.weeklyData || []);
                    setError(null);
                } else {
                    setError(response.data.message || "Failed to load dashboard data");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Unable to connect to the backend server. Please check if Apache and MySQL are running in XAMPP.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // "response.data" is the JSON that PHP sent back.Stats get saved into React state.

    const formatAmount = (value) => {
        return new Intl.NumberFormat("en-US").format(value || 0);
    };

    const renderDonutChart = () => {
        const categories = stats.fundsRaisedByCategory || [];
        const total = stats.totalFundsRaised || 0;

        const colorMap = {
            'Education': '#1e75e6',        // Blue
            'Sports': '#0db853',           // Green
            'Charity': '#9333ea',          // Purple
            'Health & Medical': '#f59e0b', // Yellow/Orange
            'Environment': '#ef4444',      // Red
            'Other': '#94a3b8'             // Gray
        };

        if (total === 0) {
            return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-6 w-full">
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0 mx-auto sm:mx-0">
                        <svg viewBox="0 0 120 120" className="w-full h-full">
                            <circle cx="60" cy="60" r="44" fill="transparent" stroke="#f1f5f9" strokeWidth="22" transform="rotate(-90 60 60)" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Raised</span>
                            <span className="text-sm sm:text-base font-black text-slate-800 mt-0.5">Rs. 0</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-3 w-full max-w-[280px]">
                        {Object.keys(colorMap).map((catName) => (
                            <div key={catName} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorMap[catName] }}></div>
                                    <span className="text-slate-600 font-semibold">{catName}</span>
                                </div>
                                <span className="text-slate-400 font-bold text-right min-w-[40px]">0%</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const radius = 44;
        const circumference = 2 * Math.PI * radius; // ~276.46
        let accumulatedLength = 0;
        let runningAngle = 0;

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-6 w-full">
                {/* SVG Donut Circle */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0 mx-auto sm:mx-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                        {/* Background base track */}
                        <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f8fafc" strokeWidth="22" transform="rotate(-90 60 60)" />

                        {/* Segments */}
                        {categories.map((cat, idx) => {
                            const color = colorMap[cat.name] || '#94a3b8';
                            const strokeLength = (cat.raised / total) * circumference;
                            const strokeOffset = -accumulatedLength;
                            accumulatedLength += strokeLength;

                            if (strokeLength === 0) return null;

                            return (
                                <circle
                                    key={idx}
                                    cx="60"
                                    cy="60"
                                    r={radius}
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="22"
                                    strokeDasharray={`${strokeLength} ${circumference}`}
                                    strokeDashoffset={strokeOffset}
                                    transform="rotate(-90 60 60)"
                                    className="transition-all duration-300 hover:stroke-[24px] cursor-pointer"
                                />
                            );
                        })}

                        {/* Inner cutout hole to ensure it's a donut */}
                        <circle cx="60" cy="60" r="31" fill="white" />

                        {/* Text labels inside segments */}
                        {categories.map((cat, idx) => {
                            const percentage = cat.percentage;
                            const angle = (percentage / 100) * 360;
                            const startAngle = runningAngle;
                            const endAngle = runningAngle + angle;
                            const midAngle = (startAngle + endAngle) / 2;
                            runningAngle += angle;

                            if (percentage < 5) return null; // Don't show labels for tiny segments to avoid overlap

                            const rad = ((midAngle - 90) * Math.PI) / 180;
                            const textRadius = 44; // center of track
                            const tx = 60 + textRadius * Math.cos(rad);
                            const ty = 60 + textRadius * Math.sin(rad);

                            return (
                                <text
                                    key={`txt-${idx}`}
                                    x={tx}
                                    y={ty}
                                    fill="white"
                                    fontSize="8px"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="pointer-events-none select-none font-bold"
                                >
                                    {Math.round(percentage)}%
                                </text>
                            );
                        })}
                    </svg>
                    {/* Center text in donut hole */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none select-none">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Raised</span>
                        <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5" title={`Rs. ${formatAmount(total)}`}>
                            Rs. {formatAmount(total)}
                        </span>
                    </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 space-y-3 w-full max-w-[280px]">
                    {categories.map((cat, idx) => {
                        const color = colorMap[cat.name] || '#94a3b8';
                        return (
                            <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                                    <span className="text-slate-600 font-semibold truncate max-w-[160px]" title={cat.name}>
                                        {cat.name}
                                    </span>
                                </div>
                                <span className="text-slate-800 font-extrabold text-right min-w-[40px]">
                                    {cat.percentage}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex bg-[#f8fafc] selection:bg-blue-600 min-h-screen text-slate-800 selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Sidebar />
                <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 p-8">
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </main>
            </div>
        );
    }

    {/* Weekly Data */ }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today);
    periodStart.setDate(today.getDate() - 6);
    const weekdayIndexes = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    const periodFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
    const displayWeeklyData = weeklyData
        .map((item) => {
            const dayIndex = weekdayIndexes[item.day];
            const daysAgo = (today.getDay() - dayIndex + 7) % 7;
            const date = new Date(today);
            date.setDate(today.getDate() - daysAgo);

            return {
                ...item,
                date,
                dateLabel: dateFormatter.format(date),
                isToday: date.getTime() === today.getTime()
            };
        })
        .sort((a, b) => a.date - b.date);

    const datasetMax = Math.max(
        ...displayWeeklyData.flatMap(d => [d.organizers, d.donors])
    ) || 1;

    const getGridValues = (maxVal) => {
        if (maxVal <= 1) {
            return [2, 1, 0];
        } else if (maxVal <= 4) {
            return [5, 4, 3, 2, 1, 0];
        } else if (maxVal <= 10) {
            return [10, 8, 6, 4, 2, 0];
        } else if (maxVal <= 20) {
            return [20, 15, 10, 5, 0];
        } else if (maxVal <= 50) {
            return [50, 40, 30, 20, 10, 0];
        } else {
            const roundedMax = Math.ceil(maxVal / 10) * 10;
            const step = roundedMax / 5;
            const vals = [];
            for (let i = roundedMax; i >= 0; i -= step) {
                vals.push(i);
            }
            return vals;
        }
    };

    const gridValues = getGridValues(datasetMax);
    const yMax = gridValues[0];

    return (
        <>
            <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
                {/* Sidebar Component */}
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Main Content Area */}
                <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
                    <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
                        {/* Header */}
                        <div className="space-y-1 text-left">
                            <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">Admin Dashboard</h1>
                            <p className="font-semibold text-slate-400 text-xs md:text-sm">Platform Overview & Statistics</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3">
                                <AlertCircle className="text-red-600" size={20} />
                                <span className="text-red-700 font-semibold text-sm">{error}</span>
                            </div>
                        )}

                        {/* Stat Cards Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                            {/* Active Organizers Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Organizers</p>
                                        <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.activeOrganizers}</p>
                                    </div>
                                    <div className="bg-blue-50 group-hover:bg-blue-100 p-3 rounded-2xl transition-colors">
                                        <Users className="text-blue-600" size={24} />
                                    </div>
                                </div>
                                <p className="text-emerald-600 text-xs font-bold">✓ Verified & Active</p>
                            </div>

                            {/* Active Donors Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Donors</p>
                                        <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.activeDonors}</p>
                                    </div>
                                    <div className="bg-emerald-50 group-hover:bg-emerald-100 p-3 rounded-2xl transition-colors">
                                        <UserCheck className="text-emerald-600" size={24} />
                                    </div>
                                </div>
                                <p className="text-emerald-600 text-xs font-bold">✓ Active Contributors</p>
                            </div>

                            {/* Total Projects Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Projects</p>
                                        <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalProjects}</p>
                                    </div>
                                    <div className="bg-purple-50 group-hover:bg-purple-100 p-3 rounded-2xl transition-colors">
                                        <TrendingUp className="text-purple-600" size={24} />
                                    </div>
                                </div>
                                <p className="text-emerald-600 text-xs font-bold">✓ Active Fundraisers</p>
                            </div>

                            {/* Total Users Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Users</p>
                                        <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalUsers}</p>
                                    </div>
                                    <div className="bg-orange-50 group-hover:bg-orange-100 p-3 rounded-2xl transition-colors">
                                        <Users className="text-orange-600" size={24} />
                                    </div>
                                </div>
                                <p className="text-emerald-600 text-xs font-bold">✓ Registered Members</p>
                            </div>
                        </div>

                        {/* Main Grid for charts and stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
                            {/* Weekly Activity Chart */}
                            <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 w-full flex flex-col justify-between">
                                <div>
                                    <h2 className="font-extrabold text-slate-800 text-lg md:text-xl tracking-tight mb-1 text-left">Weekly Registration Activity</h2>
                                    <p className="text-xs font-semibold text-slate-400 mb-6 text-left">
                                        {periodFormatter.format(periodStart)} - {periodFormatter.format(today)}
                                    </p>

                                    {displayWeeklyData.length > 0 ? (
                                        <>
                                            {/* Bar Chart Container */}
                                            <div className="mb-6 mt-4">
                                                {/* Chart area: height is h-72 (18rem / 288px) */}
                                                <div className="flex h-72 w-full relative items-end">
                                                    {/* Y-Axis Labels Column on the left */}
                                                    <div className="w-8 flex flex-col justify-between h-64 text-right pr-2 text-[10px] font-extrabold text-slate-400 select-none pb-[2px]">
                                                        {gridValues.map((val) => (
                                                            <span key={val}>{val}</span>
                                                        ))}
                                                    </div>

                                                    {/* Main Chart Canvas on the right */}
                                                    <div className="flex-1 h-64 relative">
                                                        {/* Grid lines (Background) */}
                                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                            {gridValues.map((val) => (
                                                                <div key={val} className="w-full h-0 border-t border-dashed border-slate-100"></div>
                                                            ))}
                                                        </div>

                                                        {/* Bars container */}
                                                        <div className="absolute inset-0 flex items-end justify-around pl-4 pr-4">
                                                            {displayWeeklyData.map((item, index) => {
                                                                return (
                                                                    <div key={index} className="h-full flex flex-col items-center justify-end relative" style={{ width: '12%' }}>
                                                                        {/* Day Bar Group (Organizers + Donors side-by-side) */}
                                                                        <div className="w-full flex justify-center gap-1 sm:gap-1.5 items-end h-full">
                                                                            {/* Organizers Bar */}
                                                                            <div className="flex flex-col items-center w-3 sm:w-4 md:w-5 lg:w-6 h-full justify-end relative group/org">
                                                                                <div
                                                                                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-300 w-full hover:from-blue-600 hover:to-blue-500 hover:shadow-lg cursor-pointer"
                                                                                    style={{
                                                                                        height: `${(item.organizers / yMax) * 100}%`,
                                                                                        minHeight: item.organizers > 0 ? '4px' : '0'
                                                                                    }}
                                                                                    title={`Organizers: ${item.organizers}`}
                                                                                />
                                                                            </div>

                                                                            {/* Donors Bar */}
                                                                            <div className="flex flex-col items-center w-3 sm:w-4 md:w-5 lg:w-6 h-full justify-end relative group/donor">
                                                                                <div
                                                                                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all duration-300 w-full hover:from-green-600 hover:to-green-500 hover:shadow-lg cursor-pointer"
                                                                                    style={{
                                                                                        height: `${(item.donors / yMax) * 100}%`,
                                                                                        minHeight: item.donors > 0 ? '4px' : '0'
                                                                                    }}
                                                                                    title={`Donors: ${item.donors}`}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Day Labels at the bottom of the chart area */}
                                                <div className="flex w-full pl-8">
                                                    <div className="flex-1 flex justify-around pl-4 pr-4">
                                                        {displayWeeklyData.map((item, index) => (
                                                            <div key={index} className={`text-center font-extrabold text-[9px] sm:text-xs leading-tight py-1 ${item.isToday ? "text-slate-800" : "text-slate-500"}`} style={{ width: '12%' }}>
                                                                <span className="block">{item.dateLabel}</span>
                                                                {item.isToday && <span className="block">(Today)</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Legend */}
                                            <div className="flex gap-6 pt-4 justify-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 bg-gradient-to-b from-blue-500 to-blue-400 rounded"></div>
                                                    <span className="text-sm text-slate-700 font-medium">Organizers</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 bg-gradient-to-b from-green-500 to-green-400 rounded"></div>
                                                    <span className="text-sm text-slate-700 font-medium">Donors</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-slate-500">No data available yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fundraising Overview Section */}
                            <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 w-full flex flex-col justify-between">
                                <div>
                                    <h2 className="font-extrabold text-slate-800 text-lg md:text-xl tracking-tight mb-6 text-left">Fundraising Overview</h2>

                                    {/* 4 columns for Fundraising Summary Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                        {/* Card 1 - Total Funds Raised */}
                                        <div className="bg-[#f3f8fc] rounded-2xl p-3 border border-[#e8f1f7] flex flex-col items-center justify-between text-center min-h-[110px]">
                                            <div className="text-[#1e75e6] mb-2">
                                                <Database size={24} />
                                            </div>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-tight">Total Funds Raised</span>
                                            <span className="text-sm font-extrabold text-[#1e75e6] mt-1">
                                                Rs. {formatAmount(stats.totalFundsRaised)}
                                            </span>
                                        </div>

                                        {/* Card 2 - Total Donations */}
                                        <div className="bg-[#f0fbf4] rounded-2xl p-3 border border-[#e2f5e8] flex flex-col items-center justify-between text-center min-h-[110px]">
                                            <div className="text-[#0db853] mb-2">
                                                <Handshake size={24} />
                                            </div>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-tight">Total Donations</span>
                                            <span className="text-sm font-extrabold text-[#0db853] mt-1">
                                                {formatAmount(stats.totalDonations)}
                                            </span>
                                        </div>

                                        {/* Card 3 - Average Donation */}
                                        <div className="bg-[#faf5ff] rounded-2xl p-3 border border-[#f3e8ff] flex flex-col items-center justify-between text-center min-h-[110px]">
                                            <div className="text-[#9333ea] mb-2">
                                                <Coins size={24} />
                                            </div>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-tight">Average Donation</span>
                                            <span className="text-sm font-extrabold text-[#9333ea] mt-1">
                                                Rs. {formatAmount(stats.averageDonation)}
                                            </span>
                                        </div>

                                        {/* Card 4 - Successful Campaigns */}
                                        <div className="bg-[#fff7ed] rounded-2xl p-3 border border-[#ffedd5] flex flex-col items-center justify-between text-center min-h-[110px]">
                                            <div className="text-[#f59e0b] mb-2">
                                                <Flag size={24} />
                                            </div>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-tight">Successful Campaigns</span>
                                            <span className="text-sm font-extrabold text-[#f59e0b] mt-1">
                                                {formatAmount(stats.successfulCampaigns)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Donut Chart Segment */}
                                    <div className="border-t border-slate-100 pt-6">
                                        <h3 className="font-extrabold text-slate-800 text-sm mb-4 text-left">Funds Raised by Category</h3>
                                        {renderDonutChart()}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </>
    )
}

export default Dashboard