import { useState, useEffect } from 'react';
import Sidebar from './component/sidebar';
import { useNavigate, Link } from 'react-router-dom';
import {
  Coins,
  TrendingUp,
  Clock,
  Users,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Sparkles
} from 'lucide-react';
import hero from '../../assets/images/hero_illustration-YsxwO9yy.png';
import { getOrganizerDashboardData, logout } from '../../services/authService';

// ==================== Organizer Dashboard Component ====================
const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeCount: 0,
    pendingCount: 0,
    donorCount: 0,
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOrganizerDashboardData();
        if (response.data && response.data.success) {
          const data = response.data.data;
          setUser(data.organizer);
          setStats(data.stats);
          setCampaigns(data.campaigns || []);
          setRecentDonations(data.recentDonations || []);
        } else {
          setError(response.data.message || 'Failed to fetch dashboard data.');
        }
      } catch (err) {
        console.error('Error fetching organizer dashboard data:', err);
        setError(err.response?.data?.message || 'Error connecting to the server. Please check your backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout().catch(err => console.error('Logout API error:', err));
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userID');
    navigate('/login');
  };

  const getProjectImage = (project) => {
    let img = project.image;
    if (!img) return null;

    if (img.startsWith('uploads/') || img.startsWith('/uploads/')) {
      const cleanPath = img.startsWith('/') ? img.substring(1) : img;
      return `${import.meta.env.VITE_BACKEND_URL}/${cleanPath}`;
    }

    return img;
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
          <p className="font-bold text-slate-500 text-sm">Loading Organizer Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center bg-slate-50 min-h-screen">
        <div className="space-y-4 bg-white shadow-xl p-8 border border-red-100 rounded-2xl max-w-md text-center">
          <div className="flex justify-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">Failed to Load Dashboard</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#004bd6] hover:bg-[#0037a5] px-5 py-2.5 rounded-xl font-bold text-white text-xs transition-colors shadow-md shadow-blue-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Funds Raised',
      value: formatCurrency(stats.totalRaised),
      icon: Coins,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCount,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingCount,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
    },
    {
      title: 'Total Contributors',
      value: stats.donorCount,
      icon: Users,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
    }
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex flex-col flex-1 md:pl-72 min-w-0 overflow-y-auto">
        <div className="flex-1 space-y-6 sm:space-y-8 mx-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl">
          {activeTab === 'dashboard' && (
            <>
              {/* 1. Welcome / Hero Banner */}
              <div className="relative bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-200/80 rounded-3xl sm:rounded-[2rem] overflow-hidden">
                <div className="top-0 right-0 absolute bg-blue-100/50 blur-3xl rounded-full w-72 h-72 pointer-events-none"></div>
                <div className="bottom-0 left-0 absolute bg-indigo-100/40 blur-3xl rounded-full w-60 h-60 pointer-events-none"></div>

                <div className="relative flex lg:flex-row flex-col justify-between items-center gap-6 p-6 sm:p-8 lg:p-10">
                  {/* Left Content */}
                  <div className="flex-1 w-full max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 bg-blue-50/80 px-3.5 py-1.5 border border-blue-100 rounded-full font-black text-blue-700 text-[11px] tracking-wider uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      ORGANIZER PORTAL
                    </div>

                    <div>
                      <h1 className="font-black text-slate-900 text-2xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
                        Welcome back, <br className="hidden sm:inline" />
                        <span className="text-[#004bd6]">
                          {user?.club_name || user?.fullName || 'Campus Organizer'}
                        </span>
                      </h1>
                      <p className="mt-2 font-medium text-slate-500 text-xs sm:text-sm max-w-lg leading-relaxed">
                        Manage your student initiatives, verify donor payment slips, post milestone updates, and track transparent funding progress.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        to="/organizer/create-project"
                        className="inline-flex items-center gap-2 bg-[#004bd6] hover:bg-[#0037a5] shadow-lg shadow-blue-500/20 active:scale-[0.98] hover:-translate-y-0.5 px-5 sm:px-6 py-3 rounded-2xl font-black text-white text-xs sm:text-sm transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" />
                        Launch New Project
                      </Link>
                    </div>
                  </div>

                  {/* Right Illustration */}
                  <div className="relative w-full sm:w-[42%] max-w-[280px] lg:max-w-[320px] shrink-0 flex justify-center">
                    <img
                      src={hero}
                      alt="Organizer Dashboard"
                      className="w-full h-auto object-contain drop-shadow-sm select-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Stat Cards Grid */}
              <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-5 sm:p-6 border border-slate-100 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="space-y-1.5">
                        <span className="block font-black text-slate-400 text-[11px] uppercase tracking-wider">
                          {card.title}
                        </span>
                        <span className="font-black text-slate-800 text-2xl sm:text-3xl tracking-tight">
                          {card.value}
                        </span>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconBg} shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Main Content: Campaigns & Recent Activity */}
              <div className="gap-6 lg:gap-8 grid grid-cols-1 lg:grid-cols-3">
                {/* Left Column: Campaigns */}
                <div className="space-y-5 lg:col-span-2">
                  <div className="flex justify-between items-center">
                    <h2 className="flex items-center gap-2 font-black text-slate-800 text-lg sm:text-xl tracking-tight">
                      My Campaigns
                      <span className="bg-emerald-500 rounded-full w-2 h-2" />
                    </h2>
                    <Link
                      to="/organizer/my-project"
                      className="flex items-center gap-1 font-bold text-xs text-[#004bd6] hover:text-[#0037a5] transition-colors"
                    >
                      View All ({campaigns.length})
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white p-10 border border-dashed border-slate-200 rounded-3xl text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#004bd6]">
                        <FolderPlus className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 text-sm">No Campaigns Published Yet</h3>
                        <p className="font-medium text-slate-400 text-xs max-w-sm">
                          Start your first campus fundraising campaign to gather support from university alumni and donors.
                        </p>
                      </div>
                      <Link
                        to="/organizer/create-project"
                        className="bg-[#004bd6] hover:bg-[#0037a5] px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md shadow-blue-200 transition-all"
                      >
                        Create Campaign
                      </Link>
                    </div>
                  ) : (
                    <div className="gap-5 sm:gap-6 grid grid-cols-1 sm:grid-cols-2">
                      {campaigns.map((project) => {
                        const rawPercentage = project.goal > 0 ? (project.raised / project.goal) * 100 : 0;
                        const percentage = rawPercentage.toFixed(1);
                        const barWidth = Math.min(rawPercentage, 100);
                        const projectImage = getProjectImage(project);
                        const isSuspended = project.status === 'SUSPENDED' || project.status === 'Suspended';
                        const isRejected = project.status === 'REJECTED' || project.status === 'Rejected';
                        const isEndDatePassed = project.endDate && new Date(project.endDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                        const isCompleted = project.status === 'COMPLETED' || project.status === 'Completed' || isEndDatePassed;

                        return (
                          <div
                            key={project.id}
                            className="group flex flex-col justify-between bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-slate-100 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                          >
                            <div className="relative bg-slate-100 w-full h-44 overflow-hidden">
                              {projectImage ? (
                                <img
                                  src={projectImage}
                                  alt={project.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
                                  No Banner Image
                                </div>
                              )}

                              {/* Category Badge (Unified Brand Pill) */}
                              <div className="top-3 left-3 absolute flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex bg-[#fef2e9] text-[#ea580c] border border-orange-100/60 shadow-sm px-2.5 py-1 rounded-[6px] font-black text-[9px] uppercase tracking-wider">
                                  {project.category || 'CAMPAIGN'}
                                </span>

                                {isSuspended && (
                                  <span className="inline-flex px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                    Suspended
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-100">
                                    Rejected
                                  </span>
                                )}
                                {isCompleted && !isSuspended && !isRejected && (
                                  <span className="inline-flex px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    Completed
                                  </span>
                                )}
                              </div>

                              {project.verified && (
                                <span
                                  className="top-3 right-3 absolute bg-blue-600 shadow-md p-1.5 rounded-full text-white"
                                  title="Verified Campaign"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col flex-1 justify-between p-5 space-y-4">
                              <div className="space-y-1.5">
                                <h3 className="font-extrabold text-slate-800 group-hover:text-[#004bd6] text-sm sm:text-base line-clamp-1 leading-snug transition-colors">
                                  {project.title}
                                </h3>
                                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                  {project.tagline || project.description || 'Campus student fundraising initiative.'}
                                </p>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-slate-50">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-emerald-600">{formatCurrency(project.raised)} raised</span>
                                  <span className="font-black text-slate-600">{percentage}%</span>
                                </div>
                                <div className="bg-slate-100 rounded-full w-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-full transition-all duration-700"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                  <span>Goal: {formatCurrency(project.goal)}</span>
                                  <span>{project.daysLeft || 0} days left</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Recent Activity */}
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <h2 className="flex items-center gap-2 font-black text-slate-800 text-lg sm:text-xl tracking-tight">
                      Recent Activity
                      <span className="bg-blue-500 rounded-full w-2 h-2 animate-pulse" />
                    </h2>
                  </div>

                  <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 sm:p-6 border border-slate-100 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-black text-slate-400 text-[11px] uppercase tracking-wider">
                        Direct Contributions
                      </span>
                      <span className="font-bold text-xs text-slate-400">
                        {recentDonations.length} Recent
                      </span>
                    </div>

                    {recentDonations.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <Coins className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-400 text-xs">No recent donations recorded</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 space-y-3">
                        {recentDonations.map((donation, i) => (
                          <div key={i} className="flex items-start gap-3.5 pt-3 first:pt-0">
                            <div className="flex justify-center items-center bg-blue-50 text-blue-600 border border-blue-100/60 rounded-xl w-9 h-9 shrink-0 shadow-sm">
                              <Coins className="w-4 h-4" />
                            </div>

                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="block font-black text-slate-800 text-xs truncate">
                                  {donation.donorName}
                                </span>
                                <span className="font-black text-emerald-600 text-xs">
                                  {formatCurrency(donation.amount)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate font-medium">
                                {donation.project}
                              </p>
                              <div className="flex justify-between items-center pt-1">
                                <span className="font-semibold text-[10px] text-slate-400">
                                  {donation.date}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${donation.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                  {donation.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
