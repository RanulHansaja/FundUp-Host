import { useState, useEffect } from 'react';
import { Trophy, Heart, TrendingUp, Medal, Star, Share2, Award, CheckCircle2, Gift, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './component/sideBar';
import { getDonorDashboardData, getMyDonations } from '../../services/authService';

function RecognitionAndBadges() {
  const navigate = useNavigate();
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [donorData, setDonorData] = useState(null);
  const [donationsList, setDonationsList] = useState([]);

  // Fetch current user from localStorage
  const [currentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role?.toUpperCase() === 'DONOR') return parsed;
      } catch {
        console.error('Failed to parse current user.');
      }
    }
    return null;
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard data for total donations and current badge
        const dashRes = await getDonorDashboardData({ userID: currentUser.userID });
        if (dashRes.data && dashRes.data.success) {
          setDonorData(dashRes.data.data.donor);
        }

        // Fetch donations list
        const donRes = await getMyDonations({ limit: 100 }); 
        if (donRes.data && donRes.data.success) {
          setDonationsList(donRes.data.data.donations);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, navigate]);

  if (loading) {
     return (
        <div className="flex bg-[#f8fafc] min-h-screen">
          <Sidebar activeTab="recognition" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={{ name: 'Loading...' }} />
          <main className="flex-1 md:pl-72 flex justify-center items-center">
             <div className="flex flex-col items-center gap-3">
               <div className="border-4 border-blue-500 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
               <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Loading stats...</p>
             </div>
          </main>
        </div>
     );
  }

  const totalDonations = donorData?.totalDonation || 0;
  let currentBadgeLevel = donorData?.badgeLevel || 'NONE';
  if (currentBadgeLevel === 'NONE' && totalDonations >= 5000) currentBadgeLevel = 'Starter';
  
  const approvedDonations = donationsList.filter(d => d.paymentStatus === 'APPROVED');
  const donationsCount = approvedDonations.length;

  // A promotion is earned only for single transactions of 50,000 or more
  const promotionsEarned = approvedDonations.filter(d => d.amount >= 50000).length;

  const formatRs = (val) => new Intl.NumberFormat('en-LK').format(val);

  const badgeTiers = [
    { name: 'Starter Supporter', min: 5000, desc: 'Awarded for starting your contribution journey.', icon: Star, color: 'text-slate-400', border: 'border-slate-200', glow: '' },
    { name: 'Bronze Supporter', min: 25000, desc: 'Awarded for continued support and active participation.', icon: Shield, color: 'text-orange-600', border: 'border-orange-200', glow: 'shadow-[0_0_15px_rgba(234,88,12,0.15)]' },
    { name: 'Silver Supporter', min: 50000, desc: 'Awarded for reaching a significant milestone in your contributions.', icon: Medal, color: 'text-slate-400', border: 'border-blue-300', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { name: 'Gold Supporter', min: 100000, desc: 'Awarded for an outstanding level of support for our campaigns.', icon: Trophy, color: 'text-yellow-500', border: 'border-yellow-300', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
    { name: 'Platinum Supporter', min: 500000, desc: 'Awarded to top-tier supporters for exceptional generosity.', icon: Award, color: 'text-indigo-400', border: 'border-indigo-300', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]' },
  ];

  const badgeLevels = badgeTiers.map((tier, idx) => ({
    id: idx + 1,
    ...tier,
    minAmount: `Rs. ${formatRs(tier.min)}+`,
    status: totalDonations >= tier.min ? 'unlocked' : 'locked'
  }));

  let currentTierObj = null;
  let nextTierObj = badgeTiers.find(t => t.min > totalDonations);
  
  for (let i = badgeTiers.length - 1; i >= 0; i--) {
      if (totalDonations >= badgeTiers[i].min) {
          currentTierObj = badgeTiers[i];
          break;
      }
  }

  if (!currentTierObj) {
      currentTierObj = {
          name: 'No Badge',
          min: 0,
          desc: 'Donate Rs. 5,000 or more to earn your first badge.',
          icon: (props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          ),
          color: 'text-slate-300',
          border: 'border-slate-200',
          glow: ''
      };
  }

  const summaryCards = [
    { id: 1, title: 'Total Donations', value: `Rs. ${formatRs(totalDonations)}`, subtitle: 'Lifetime contribution', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', hoverShadow: 'hover:shadow-red-500/5' },
    { id: 2, title: 'Current Badge', value: currentTierObj.name.replace(' Supporter', ''), subtitle: 'Based on total support', icon: currentTierObj.icon, color: currentTierObj.color, bg: 'bg-slate-100', hoverShadow: 'hover:shadow-slate-500/5' },
    { id: 3, title: 'Promotions Earned', value: promotionsEarned.toString(), subtitle: 'Single donations >= 50k', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50', hoverShadow: 'hover:shadow-purple-500/5' },
    { id: 4, title: 'Donations Made', value: donationsCount.toString(), subtitle: 'Approved contributions', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', hoverShadow: 'hover:shadow-emerald-500/5' }
  ];

  let progressPercent = 100;
  let remainingToNext = 0;
  let nextTierName = 'Max Tier Reached';

  if (nextTierObj) {
      nextTierName = nextTierObj.name;
      remainingToNext = nextTierObj.min - totalDonations;
      let prevMin = 0;
      let highestUnlocked = badgeTiers.slice().reverse().find(t => totalDonations >= t.min);
      if (highestUnlocked) {
          prevMin = highestUnlocked.min;
      }
      const gap = nextTierObj.min - prevMin;
      const progressInGap = totalDonations - prevMin;
      progressPercent = Math.min(100, Math.max(0, Math.round((progressInGap / gap) * 100)));
  }

  const eligibilityTimeline = [
    { id: 1, milestone: 'Donate Rs. 5,000+', reward: 'Earn Starter Badge', completed: totalDonations >= 5000 },
    { id: 2, milestone: 'Donate Rs. 25,000+', reward: 'Earn Bronze Badge', completed: totalDonations >= 25000 },
    { id: 3, milestone: 'Donate Rs. 50,000+', reward: 'Earn Silver Badge', completed: totalDonations >= 50000 },
    { id: 4, milestone: 'Donate Rs. 100,000+', reward: 'Earn Gold Badge', completed: totalDonations >= 100000 },
    { id: 5, milestone: 'Donate Rs. 500,000+', reward: 'Earn Platinum Badge', completed: totalDonations >= 500000 },
  ];

  const donationHistoryList = donationsList.slice(0, 10).map((d) => {
      let badgeEarned = 'None';
      if (d.paymentStatus === 'APPROVED') {
          if (d.amount >= 500000) badgeEarned = 'Platinum';
          else if (d.amount >= 100000) badgeEarned = 'Gold';
          else if (d.amount >= 50000) badgeEarned = 'Silver';
          else if (d.amount >= 25000) badgeEarned = 'Bronze';
          else if (d.amount >= 5000) badgeEarned = 'Starter';
      }

      let statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
      if (d.paymentStatus === 'APPROVED') statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      else if (d.paymentStatus === 'REJECTED') statusColor = 'bg-red-100 text-red-700 border-red-200';

      return {
          id: d.id,
          project: d.projectName,
          amount: `Rs. ${formatRs(d.amount)}`,
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          badge: badgeEarned,
          status: d.paymentStatus === 'APPROVED' ? 'Completed' : (d.paymentStatus === 'REJECTED' ? 'Failed' : 'Pending'),
          statusColor
      };
  });

  const benefitsList = [
    { id: 1, title: 'Digital Badge', desc: 'Donors receive a badge based on their donation amount.', icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, title: 'Earn Promotions', desc: 'Donors can earn promotions based on their eligible donations.', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 3, title: 'Top Contributors', desc: 'Donors can be featured among the Top Contributors.', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 4, title: 'Public Recognition', desc: 'Visitors can recognize them as a donor through the Home Page.', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex bg-[#f8fafc] selection:bg-blue-600 min-h-screen text-slate-800 selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── SIDEBAR ── */}
      <Sidebar 
          activeTab="recognition" 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          user={donorData ? { ...donorData, name: donorData.fullName, badgeLevel: currentBadgeLevel } : null}
        />

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
          
          <header className="md:hidden top-0 z-20 sticky flex items-center justify-between bg-white p-4 border-slate-100 border-b">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-600 text-lg tracking-tight">FundUp</span>
            </div>
          </header>

          <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
            
            {/* 1. Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1 text-left">
                    <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
                        Recognition & Badges
                    </h1>
                    <p className="font-semibold text-slate-500 text-sm">
                        Every contribution you make helps university students achieve their goals. Earn badges, unlock recognition, and showcase your generosity through FundUp.
                    </p>
                </div>
            </div>

            {/* 2. Donor Summary Cards */}
            <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.id} className={`group flex flex-col justify-center bg-white shadow-sm ${card.hoverShadow} hover:shadow-md p-5 border border-slate-100 rounded-2xl transition-all hover:-translate-y-0.5 duration-300`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">{card.title}</span>
                      <div className={`p-2.5 rounded-xl ${card.bg} group-hover:bg-blue-600 ${card.color} group-hover:text-white transition-all duration-300`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight">{card.value}</h3>
                      <p className="mt-1 font-semibold text-[10px] text-slate-400">{card.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Current Badge Card */}
            <div className="relative flex md:flex-row flex-col justify-between items-center gap-6 bg-white shadow-sm p-6 border border-slate-100 rounded-[2rem] overflow-hidden">
              <div className="z-10 flex flex-col items-center justify-center bg-slate-50/50 p-5 border border-slate-100 rounded-2xl w-full md:w-1/3 text-center">
                <currentTierObj.icon className={`mx-auto mb-4 w-16 h-16 ${currentTierObj.color} drop-shadow-sm`} />
                <h3 className="font-extrabold text-xl text-slate-800 tracking-tight capitalize">{currentTierObj.name}</h3>
                <div className="inline-flex items-center gap-1.5 bg-blue-50 mt-3 px-3 py-1 rounded-full">
                  <span className="relative flex w-2 h-2">
                    <span className="inline-flex absolute bg-blue-400 opacity-75 rounded-full w-full h-full animate-ping"></span>
                    <span className="inline-flex relative bg-blue-500 rounded-full w-2 h-2"></span>
                  </span>
                  <span className="font-bold text-[9px] text-blue-700 uppercase tracking-widest">Active Badge</span>
                </div>
              </div>

              <div className="z-10 flex-1 space-y-6 w-full text-left">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg md:text-xl">You have donated Rs. {formatRs(totalDonations)}</h3>
                  {nextTierObj ? (
                    <p className="mt-1 font-semibold text-slate-400 text-xs md:text-sm">Donate another Rs. {formatRs(remainingToNext)} to unlock {nextTierObj.name}.</p>
                  ) : (
                    <p className="mt-1 font-semibold text-slate-400 text-xs md:text-sm">You have unlocked the highest possible tier!</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-500 text-xs uppercase tracking-wider">
                    <span>Progress to {nextTierName}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full w-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 rounded-full h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Badge Levels Section */}
            <div className="space-y-6 mt-6">
              <div className="text-left">
                <h2 className="font-bold text-slate-800 text-lg tracking-tight">Badge Tiers</h2>
                <p className="font-semibold text-slate-400 text-xs md:text-sm">Unlock higher tiers by contributing more to campus campaigns.</p>
              </div>

              <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                {badgeLevels.map((badge) => {
                  const Icon = badge.icon;
                  const isUnlocked = badge.status === 'unlocked';
                  return (
                    <div 
                      key={badge.id} 
                      onMouseEnter={() => setHoveredBadge(badge.id)}
                      onMouseLeave={() => setHoveredBadge(null)}
                      className={`relative bg-white p-5 border rounded-xl transition-all duration-300 ${badge.border} ${isUnlocked ? badge.glow || 'shadow-sm hover:shadow-md' : 'opacity-70 grayscale-[30%]'} ${hoveredBadge === badge.id ? '-translate-y-1' : ''}`}
                    >
                      {isUnlocked && (
                        <div className="-top-2 -right-2 absolute bg-white shadow-sm p-1 rounded-full border border-slate-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      )}
                      <div className={`flex justify-center items-center w-12 h-12 rounded-xl mb-4 ${isUnlocked ? 'bg-slate-50' : 'bg-slate-100'}`}>
                        <Icon className={`w-6 h-6 ${badge.color}`} />
                      </div>
                      <h4 className="mb-1 font-bold text-slate-800 text-sm">{badge.name}</h4>
                      <span className="block mb-2 font-black text-[10px] text-blue-600 tracking-widest">{badge.minAmount}</span>
                      <p className="font-medium text-xs text-slate-500 leading-relaxed">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Recognition Benefits */}
            <div className="mt-8">
              <div className="space-y-6 bg-white p-6 border border-slate-100 shadow-sm rounded-[2rem]">
                <div className="text-left">
                  <h2 className="font-bold text-slate-800 text-lg tracking-tight">Recognition Benefits</h2>
                  <p className="font-semibold text-slate-400 text-xs md:text-sm">Perks you receive as you climb the donor ranks.</p>
                </div>

                <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                  {benefitsList.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={benefit.id} className="flex items-start gap-4 bg-slate-50/50 hover:bg-white shadow-sm hover:shadow-md p-5 border border-slate-100 rounded-2xl transition-all duration-300 hover:-translate-y-0.5">
                        <div className={`p-3 rounded-xl shrink-0 ${benefit.bg} ${benefit.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="mb-1 font-bold text-slate-800 text-sm">{benefit.title}</h4>
                          <p className="font-medium text-slate-500 text-xs leading-relaxed">{benefit.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


            {/* 6. Promotion Eligibility */}
            <div className="space-y-6">
              <div className="text-left">
                <h2 className="font-bold text-slate-800 text-lg tracking-tight">Promotion Timeline</h2>
              </div>
              
              <div className="bg-white shadow-sm p-6 border border-slate-100 rounded-[1.5rem]">
                <div className="space-y-6">
                  {eligibilityTimeline.map((item, index) => (
                    <div key={item.id} className="relative flex items-center gap-6">
                      {index !== eligibilityTimeline.length - 1 && (
                        <div className="top-10 left-[15px] absolute bg-slate-100 w-[2px] h-[calc(100%+8px)]"></div>
                      )}
                      
                      <div className={`relative z-10 flex justify-center items-center w-8 h-8 rounded-full shrink-0 border-2 ${item.completed ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      
                      <div className={`flex-1 p-4 rounded-2xl border ${item.completed ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-slate-100 opacity-60'}`}>
                        <h4 className={`font-bold text-xs ${item.completed ? 'text-slate-800' : 'text-slate-500'}`}>{item.milestone}</h4>
                        <p className={`mt-0.5 font-medium text-[11px] md:text-xs ${item.completed ? 'text-blue-600' : 'text-slate-400'}`}>{item.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            {/* 8. Motivation Banner */}
            <div className="relative bg-white shadow-sm p-8 md:p-10 border border-slate-100 rounded-[2rem] overflow-hidden text-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-indigo-600/5 blur-2xl rounded-[2rem]" />
              
              <div className="z-10 relative mx-auto max-w-2xl">
                <h2 className="mb-2 font-black text-slate-900 text-2xl md:text-3xl tracking-tight">Continue Making a Difference</h2>
                <p className="mb-8 font-semibold text-slate-500 text-xs md:text-sm leading-relaxed">
                  Every donation helps students, clubs, and university communities achieve their dreams. Your generosity creates lasting impact.
                </p>
                
                <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
                  <button onClick={() => navigate('/donor-dashboard', { state: { activeTab: 'donations' } })} className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 px-8 py-3.5 rounded-2xl w-full sm:w-auto font-bold text-white text-xs active:scale-95 transition-all">
                    My Donations
                  </button>
                  <button onClick={() => navigate('/donor-dashboard', { state: { activeTab: 'browse' } })} className="bg-white hover:bg-slate-50 shadow-sm px-8 py-3.5 border border-slate-200 rounded-2xl w-full sm:w-auto font-bold text-slate-700 text-xs active:scale-95 transition-all">
                    Browse Projects
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
    </div>
  );
}

export default RecognitionAndBadges;
