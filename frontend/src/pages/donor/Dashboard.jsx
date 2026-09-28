import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Award, Trophy, Medal, Shield, Star } from 'lucide-react';
import Sidebar from './component/sideBar';
import { getDonorDashboardData } from '../../services/authService';
import heroImg from '../../assets/images/hero_illustration-YsxwO9yy.png';
import trophyImg from '../../assets/images/gold_trophy.png';
import PaymentConfirmations from './component/PaymentConfirmations';
import ProjectCard from '../common/component/ProjectCard';
import BrowseProjects from './BrowseProjects';
import MyDonations from './MyDonations';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = (location.state?.activeTab && location.state.activeTab !== 'notifications') ? location.state.activeTab : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role?.toUpperCase() === 'DONOR') {
          return parsed;
        }
      } catch {
        console.error('Failed to parse current user.');
      }
    }
    return null;
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(false);

  const fetchData = async () => {
    if (!currentUser?.userID) return;
    try {
      setLoading(true);
      const response = await getDonorDashboardData({ userID: currentUser.userID });
      if (response.data && response.data.success) {
        setDashboardData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || "Failed to load dashboard data.");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Unable to connect to the backend server. Please check if Apache and MySQL are running in XAMPP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      try {
        const response = await getDonorDashboardData({ userID: currentUser.userID });
        if (!isMounted) return;
        if (response.data && response.data.success) {
          setDashboardData(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || "Failed to load dashboard data.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching dashboard data:", err);
        setError("Unable to connect to the backend server. Please check if Apache and MySQL are running in XAMPP.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, navigate]);


  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Donor';
    return fullName.split(' ')[0];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('LKR', 'Rs.');
  };

  const renderBadgeIcon = (level, sizeClasses = "w-6 h-6") => {
    const lvl = level ? level.toUpperCase() : 'NONE';
    switch (lvl) {
      case 'PLATINUM':
        return <Award className={`${sizeClasses} text-indigo-600 shrink-0`} />;
      case 'GOLD':
        return <img src={trophyImg} alt="Gold Trophy" className={`${sizeClasses} object-contain shrink-0`} />;
      case 'SILVER':
        return <Medal className={`${sizeClasses} text-slate-500 shrink-0`} />;
      case 'BRONZE':
        return <Shield className={`${sizeClasses} text-orange-600 shrink-0`} />;
      case 'STARTER':
        return <Star className={`${sizeClasses} text-blue-600 shrink-0`} />;
      default:
        return (
          <svg className={`${sizeClasses} text-slate-300 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        );
    }
  };

  const getBadgeStyles = (level) => {
    const lvl = level ? level.toUpperCase() : 'NONE';
    switch (lvl) {
      case 'PLATINUM':
        return {
          bg: 'bg-indigo-50/80 text-indigo-700 border-indigo-100',
          text: 'PLATINUM CONTRIBUTOR',
          glow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)] border-indigo-200'
        };
      case 'GOLD':
        return {
          bg: 'bg-amber-50/80 text-amber-700 border-amber-100',
          text: 'GOLD CONTRIBUTOR',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-200'
        };
      case 'SILVER':
        return {
          bg: 'bg-slate-100/80 text-slate-700 border-slate-200',
          text: 'SILVER CONTRIBUTOR',
          glow: 'shadow-[0_0_15px_rgba(148,163,184,0.1)] border-slate-300'
        };
      case 'BRONZE':
        return {
          bg: 'bg-orange-50/80 text-orange-700 border-orange-100',
          text: 'BRONZE CONTRIBUTOR',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)] border-orange-200'
        };
      case 'STARTER':
        return {
          bg: 'bg-slate-50/80 text-slate-600 border-slate-200',
          text: 'STARTER CONTRIBUTOR',
          glow: 'border-slate-200'
        };
      default:
        return {
          bg: 'bg-slate-100/80 text-slate-400 border-slate-200',
          text: 'NO BADGE',
          glow: 'border-slate-200'
        };
    }
  };


  const getBadgeDetails = (badgeLevel) => {
    const lvl = badgeLevel ? badgeLevel.toUpperCase() : 'NONE';
    switch (lvl) {
      case 'PLATINUM':
        return {
          title: 'Platinum Supporter',
          desc: 'Awarded to top-tier supporters for exceptional generosity.',
          milestone: 'Rs. 500,000+ UNLOCKED'
        };
      case 'GOLD':
        return {
          title: 'Gold Supporter',
          desc: 'Awarded for an outstanding level of support for our campaigns.',
          milestone: 'Rs. 100,000+ UNLOCKED'
        };
      case 'SILVER':
        return {
          title: 'Silver Supporter',
          desc: 'Awarded for reaching a significant milestone in your contributions.',
          milestone: 'Rs. 50,000+ UNLOCKED'
        };
      case 'BRONZE':
        return {
          title: 'Bronze Supporter',
          desc: 'Awarded for continued support and active participation.',
          milestone: 'Rs. 25,000+ UNLOCKED'
        };
      case 'STARTER':
        return {
          title: 'Starter Supporter',
          desc: 'Awarded for starting your contribution journey.',
          milestone: 'Rs. 5,000+ UNLOCKED'
        };
      default:
        return {
          title: 'No Badge',
          desc: 'Donate Rs. 5,000 or more to earn your first badge.',
          milestone: 'LOCKED TIER'
        };
    }
  };

  const totalDonationsAmount = dashboardData?.stats?.totalDonations || 0;
  let activeBadge = dashboardData?.donor?.badgeLevel || 'NONE';
  if (totalDonationsAmount >= 500000) activeBadge = 'PLATINUM';
  else if (totalDonationsAmount >= 100000) activeBadge = 'GOLD';
  else if (totalDonationsAmount >= 50000) activeBadge = 'SILVER';
  else if (totalDonationsAmount >= 25000) activeBadge = 'BRONZE';
  else if (totalDonationsAmount >= 5000) activeBadge = 'STARTER';
  else activeBadge = 'NONE';

  const badgeInfo = dashboardData ? getBadgeStyles(activeBadge) : { bg: '', text: '', glow: '' };
  const badgeDetailsInfo = dashboardData ? getBadgeDetails(activeBadge) : { title: '', desc: '', milestone: '' };

  return (
    <div className="flex bg-[#f8fafc] selection:bg-blue-600 min-h-screen text-slate-800 selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        user={{
          name: dashboardData ? dashboardData.donor.fullName : 'Loading...',
          role: 'Donor',
          email: dashboardData ? dashboardData.donor.email : 'Loading...',
          badgeLevel: activeBadge
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300">

        {/* Top Navbar for Mobile */}
        <header className="md:hidden top-0 z-20 sticky flex justify-between items-center bg-white p-4 border-slate-100 border-b">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-600 text-lg tracking-tight">FundUp</span>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center bg-slate-50 h-[calc(100vh-60px)] md:h-[calc(100vh-100px)]">
            <div className="flex flex-col items-center gap-3">
              <div className="border-4 border-blue-500 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
              <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Loading stats...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center p-6 md:p-10 h-[calc(100vh-60px)] md:h-[calc(100vh-100px)]">
            <div className="bg-red-50 shadow-sm p-8 border border-red-100 rounded-3xl w-full max-w-md text-red-700 text-center">
              <span className="inline-flex bg-red-100 mb-4 p-3.5 rounded-full text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h3 className="mb-1.5 font-extrabold text-lg">Failed to Connect Database</h3>
              <p className="mb-6 font-semibold text-red-600/80 text-xs leading-relaxed">{error}</p>
              <button
                onClick={() => fetchData()}
                className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 px-6 py-3 rounded-2xl font-bold text-white text-xs active:scale-95 transition-all duration-200"
              >
                Reconnect Database
              </button>
            </div>
          </div>
        ) : (
          activeTab === 'payments' ? (
            <PaymentConfirmations donorID={dashboardData?.donor?.donorID || 1} />
          ) : activeTab === 'donations' ? (
            <MyDonations />
          ) : activeTab === 'browse' ? (
            <BrowseProjects />
          ) : activeTab !== 'dashboard' ? (
            <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
              <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 mb-8 pb-6 border-slate-100 border-b">
                <div className="space-y-1 text-left">
                  <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl capitalize tracking-tight">
                    {activeTab.replace(/([A-Z])/g, ' $1').trim()}
                  </h1>
                  <p className="font-semibold text-slate-500 text-sm">
                    Manage and view your {activeTab} information.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center bg-white shadow-sm p-10 py-24 border border-slate-100 rounded-[2rem] text-center">
                <span className="bg-blue-50/70 mb-6 p-5 border border-blue-100/50 rounded-3xl text-blue-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                <h3 className="font-extrabold text-slate-800 text-lg">Under Construction</h3>
                <p className="mt-2 max-w-sm font-semibold text-slate-400 text-xs leading-relaxed">
                  We're currently building the <strong>{activeTab}</strong> tab to provide a seamless experience. Check back soon!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">

              {/* 1. WELCOME HERO CARD WITH UI/UX GLOW SCHEME */}
              <div className="relative flex md:flex-row flex-col justify-between items-center gap-8 bg-white shadow-sm p-8 md:p-11 border border-slate-100 rounded-[2.2rem] overflow-hidden">

                {/* UI/UX Ornament: Background ambient blur circle */}
                <div className="-top-20 -right-20 absolute bg-blue-400/10 blur-[80px] rounded-full w-80 h-80 pointer-events-none" />
                <div className="-bottom-20 -left-20 absolute bg-indigo-400/10 blur-[80px] rounded-full w-80 h-80 pointer-events-none" />

                <div className="z-10 relative flex-1 space-y-6 w-full text-left">

                  {/* Contributor Badge with interactive Tooltip */}
                  <div className="inline-block relative">
                    <button
                      onMouseEnter={() => setActiveTooltip(true)}
                      onMouseLeave={() => setActiveTooltip(false)}
                      onClick={() => setActiveTooltip(!activeTooltip)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold tracking-wide shadow-sm hover:scale-105 active:scale-98 transition-all ${badgeInfo.bg} ${badgeInfo.glow}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a.75.75 0 00-.707.547l-.747 2.492a2.25 2.25 0 01-1.077 1.344l-1.328.665a.75.75 0 00-.281 1.085l1.6 2.4a2.25 2.25 0 01.378 1.696l-.419 2.518a.75.75 0 00.9.858l2.5-.5a2.25 2.25 0 011.666.334l2.167 1.444a.75.75 0 00.832 0l2.167-1.444a2.25 2.25 0 011.666-.334l2.5.5a.75.75 0 00.9-.858l-.419-2.518a2.25 2.25 0 01.378-1.696l1.6-2.4a.75.75 0 00-.281-1.085l-1.328-.665a2.25 2.25 0 01-1.077-1.344l-.747-2.492a.75.75 0 00-.707-.547l-2.433-.08a2.25 2.25 0 01-1.805-1.258l-1.057-2.466a.75.75 0 00-1.388 0l-1.057 2.466a2.25 2.25 0 01-1.805 1.258l-2.433.08z" clipRule="evenodd" />
                      </svg>
                      {badgeInfo.text}
                      <svg className="opacity-60 w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    {/* Dynamic Tooltip */}
                    {activeTooltip && (
                      <div className="top-full left-0 z-30 absolute bg-slate-900 shadow-xl mt-2 p-3 border border-slate-800 rounded-xl w-56 font-semibold text-[10px] text-white leading-relaxed animate-fadeIn">
                        Tier based on total donations. Reach higher values to upgrade from Silver & Gold to Platinum!
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-extrabold text-slate-900 text-3xl md:text-5xl leading-tight tracking-tight">
                      Welcome back, <br className="hidden sm:inline" />
                      <span className="drop-shadow-sm text-blue-600">{getFirstName(dashboardData.donor.fullName)}!</span>
                    </h2>
                    <p className="max-w-sm font-semibold text-slate-400 text-xs md:text-sm leading-relaxed">
                      Your contributions are helping university communities grow. Thank you for your continued support.
                    </p>
                  </div>

                  {/* Micro Stats with custom divider lines */}
                  <div className="flex flex-wrap items-center gap-8 pt-5 border-slate-100 border-t">
                    <div>
                      <span className="block font-black text-[10px] text-slate-400 uppercase tracking-widest">Total Impact Generated</span>
                      <span className="block mt-1 font-black text-blue-600 text-2xl md:text-3xl tracking-tight">
                        {formatCurrency(dashboardData.stats.totalDonations)}
                      </span>
                    </div>
                    <div className="hidden sm:block bg-slate-100 w-[1.5px] h-9"></div>
                    <div>
                      <span className="block font-black text-[10px] text-slate-400 uppercase tracking-widest">Projects Supported</span>
                      <span className="block mt-1 font-black text-slate-800 text-2xl md:text-3xl tracking-tight">
                        {dashboardData.donor.projectsSupported}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Illustration container */}
                <div className="z-10 relative w-full md:w-[42%] max-w-[340px] shrink-0">
                  <img
                    src={heroImg}
                    alt="University fundraising illustration"
                    className="w-full h-auto object-contain hover:scale-[1.03] transition-transform duration-500 select-none"
                  />
                </div>
              </div>

              {/* 2. STAT CARDS GRID */}
              <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

                {/* Card 1: Total Donations */}
                <div className="group flex justify-between items-center bg-white shadow-sm hover:shadow-blue-500/5 hover:shadow-md p-6 border border-slate-100 rounded-2xl transition-all hover:-translate-y-0.5 duration-300">
                  <div className="space-y-2">
                    <span className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Total Donations</span>
                    <h3 className="font-black text-blue-600 text-xl md:text-2xl tracking-tight">
                      {formatCurrency(dashboardData.stats.totalDonations)}
                    </h3>
                  </div>
                  <div className="self-center bg-blue-50 group-hover:bg-blue-600 p-3.5 rounded-2xl text-blue-500 group-hover:text-white transition-all duration-300">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: Projects Supported */}
                <div className="group flex justify-between items-center bg-white shadow-sm hover:shadow-indigo-500/5 hover:shadow-md p-6 border border-slate-100 rounded-2xl transition-all hover:-translate-y-0.5 duration-300">
                  <div className="space-y-2">
                    <span className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Projects Supported</span>
                    <h3 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight">
                      {dashboardData.donor.projectsSupported}
                    </h3>
                  </div>
                  <div className="self-center bg-indigo-50 group-hover:bg-indigo-600 p-3.5 rounded-2xl text-indigo-500 group-hover:text-white transition-all duration-300">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Ongoing Projects */}
                <div className="group flex justify-between items-center bg-white shadow-sm hover:shadow-emerald-500/5 hover:shadow-md p-6 border border-slate-100 rounded-2xl transition-all hover:-translate-y-0.5 duration-300">
                  <div className="space-y-2">
                    <span className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Ongoing Projects</span>
                    <h3 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight">
                      {dashboardData.stats.activeCampaigns ?? dashboardData.stats.verifiedProjects ?? 0}
                    </h3>
                  </div>
                  <div className="self-center bg-emerald-50 group-hover:bg-emerald-600 p-3.5 rounded-2xl text-emerald-500 group-hover:text-white transition-all duration-300">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>

                {/* Card 4: Contributor Badge */}
                <div className="group flex justify-between items-center bg-white shadow-sm hover:shadow-md hover:shadow-amber-500/5 p-6 border border-slate-100 rounded-2xl transition-all hover:-translate-y-0.5 duration-300">
                  <div className="space-y-1">
                    <span className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Current Badge</span>
                    <h3 className={`font-black text-xl md:text-2xl tracking-tight capitalize ${
                      activeBadge === 'PLATINUM' ? 'text-indigo-600' :
                      activeBadge === 'GOLD' ? 'text-amber-500' :
                      activeBadge === 'SILVER' ? 'text-slate-600' :
                      activeBadge === 'BRONZE' ? 'text-orange-600' :
                      activeBadge === 'STARTER' ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {activeBadge === 'NONE' ? 'No Badge' : activeBadge.charAt(0).toUpperCase() + activeBadge.slice(1).toLowerCase()}
                    </h3>
                  </div>
                  <div className={`self-center p-3 rounded-2xl transition-all duration-300 w-14 h-14 flex items-center justify-center shrink-0 border border-slate-100 ${badgeInfo.bg}`}>
                    {renderBadgeIcon(activeBadge, "w-7 h-7")}
                  </div>
                </div>
              </div>

              {/* 3. DUAL COLUMN DETAILS SECTION */}
              <div className="items-start gap-8 grid grid-cols-1 lg:grid-cols-3">

                {/* Left Column: Active Donation Projects (2/3 width) */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 text-lg tracking-tight">
                      Your Supported Projects
                    </h2>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="font-extrabold text-blue-600 hover:text-blue-700 text-xs hover:underline active:scale-95 transition-all"
                    >
                      View All Campaigns →
                    </button>
                  </div>

                  {dashboardData.activeProjects.length === 0 ? (
                    <div className="bg-white shadow-sm p-10 border border-slate-100 rounded-2xl font-semibold text-slate-400 text-xs text-center">
                      You haven't supported any campaigns yet. Browse campaigns to make your first contribution!
                    </div>
                  ) : (
                    <div className="gap-6 grid grid-cols-1 sm:grid-cols-2">
                      {dashboardData.activeProjects.map((project) => (
                        <ProjectCard key={project.projectID} camp={project} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Live Tracking & Latest Recognition (1/3 width) */}
                <div className="space-y-6">

                  {/* Live Tracking Card */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg tracking-tight">
                        Live Tracking
                        <span className="relative flex w-2.5 h-2.5">
                          <span className="inline-flex absolute bg-emerald-400 opacity-75 rounded-full w-full h-full animate-ping"></span>
                          <span className="inline-flex relative bg-emerald-500 rounded-full w-2.5 h-2.5"></span>
                        </span>
                      </h2>
                    </div>

                    <div className="bg-white shadow-sm p-5 border border-slate-100/80 rounded-[2rem] divide-y divide-slate-100/50">
                      {dashboardData.liveTracking.map((activity, index) => (
                        <div key={index} className="group flex items-start gap-4 hover:bg-slate-50/40 px-2 py-4.5 first:pt-1 last:pb-1 rounded-xl transition-colors duration-200">
                          {/* Icon */}
                          <span className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${activity.type === 'donation'
                            ? 'bg-blue-50 text-blue-500'
                            : activity.type === 'milestone'
                              ? 'bg-purple-50 text-purple-500'
                              : 'bg-emerald-50 text-emerald-500'
                            }`}>
                            {activity.type === 'donation' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            ) : activity.type === 'milestone' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </span>

                          {/* Text details */}
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-800 text-xs leading-snug">
                              {activity.title}
                            </h5>
                            <p className="font-semibold text-slate-400 text-xs leading-relaxed">
                              {activity.message}
                            </p>
                            <span className="block pt-0.5 font-black text-[10px] text-slate-400 tracking-wide">
                              {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contributor Badge Status Card */}
                  <div className="group flex flex-col bg-white shadow-sm hover:shadow-md border border-slate-100 rounded-[2rem] overflow-hidden transition-all duration-300">

                    {/* Header */}
                    <div className="flex items-center gap-2 p-5 pb-3 border-slate-50 border-b">
                      <span className="bg-amber-50 p-1.5 rounded-lg text-amber-600 group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                        Contributor Badge Status
                      </h3>
                    </div>

                    {/* Body Content */}
                    <div className="flex items-center gap-4 bg-slate-50/50 p-5">

                      {/* Badge Emblem */}
                      <div className={`flex justify-center items-center bg-white shadow-sm p-3 border rounded-2xl w-16 h-16 overflow-hidden group-hover:scale-105 transition-transform duration-500 shrink-0 ${badgeInfo.bg}`}>
                        {renderBadgeIcon(activeBadge, "w-8 h-8")}
                      </div>

                      {/* Trophy Text details */}
                      <div className="space-y-1.5 text-left">
                        <span className="block font-black text-[9px] text-amber-600 uppercase tracking-wider">
                          {badgeDetailsInfo.milestone}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight tracking-tight">
                          {badgeDetailsInfo.title}
                        </h4>
                        <p className="max-w-[180px] font-medium text-[10px] text-slate-500 leading-normal">
                          {badgeDetailsInfo.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )
        )}
      </main>
    </div>
  );
}

export default Dashboard;