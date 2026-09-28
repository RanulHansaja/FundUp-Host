import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import Footer from "./component/Footer"
import Navbar from "./component/Navbar"
import ProjectCard from "./component/ProjectCard";
import { getProjects, getComments, submitComment } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import hero from '../../assets/images/hero_illustration-YsxwO9yy.png'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const CountUpStat = ({ end, duration = 2000, formatter = (val) => val }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{formatter(count)}</>;
};

const formatFunds = (val) => {
  if (val >= 1000000) return `Rs. ${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (val >= 1000) return `Rs. ${(val / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return `Rs. ${val}`;
};

const formatDonors = (val) => {
  if (val >= 1000) return `${(val / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return val;
};
//scroll animation
const ScrollReveal = ({ children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      className={`${className} transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
        }`}
    >
      {children}
    </div>
  );
};


function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(() => {
    return location.state?.warningMessage
      ? {
        type: "warning",
        message: location.state.warningMessage
      }
      : null;
  });

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState(null);

  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalDonors: 0,
    totalFundsRaised: 0,
    universitiesSupported: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const { currentUser } = useAuth();
  const [topDonors, setTopDonors] = useState([]);
  const [loadingTopDonors, setLoadingTopDonors] = useState(true);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [allDonors, setAllDonors] = useState([]);
  const [loadingAllDonors, setLoadingAllDonors] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");

  const openLeaderboardModal = async () => {
    setIsLeaderboardModalOpen(true);
    if (allDonors.length === 0) {
      setLoadingAllDonors(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/public/getTopDonors.php?all=true`);
        const result = await response.json();
        if (result.success && result.data) {
          setAllDonors(result.data);
        }
      } catch (err) {
        console.error("Error fetching leaderboard donors:", err);
      } finally {
        setLoadingAllDonors(false);
      }
    }
  };

  const getBadgeStyleAndLabel = (badgeLevel) => {
    const lvl = (badgeLevel || 'NONE').toUpperCase();
    switch (lvl) {
      case 'PLATINUM':
        return { label: 'Platinum Supporter', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '🏆' };
      case 'GOLD':
        return { label: 'Gold Supporter', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🥇' };
      case 'SILVER':
        return { label: 'Silver Supporter', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: '🥈' };
      case 'BRONZE':
        return { label: 'Bronze Supporter', bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: '🥉' };
      case 'STARTER':
        return { label: 'Starter Supporter', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '⭐' };
      default:
        return { label: 'Donor', bg: 'bg-slate-50 text-slate-500 border-slate-200', icon: '🏅' };
    }
  };

  const filteredLeaderboard = allDonors.filter(d => {
    if (!leaderboardSearch.trim()) return true;
    const q = leaderboardSearch.toLowerCase();
    return (d.fullName && d.fullName.toLowerCase().includes(q)) || (d.affiliation && d.affiliation.toLowerCase().includes(q));
  });

  const [comments, setComments] = useState([]);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(() => Boolean(location.state?.shareStory));
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isAuthenticated = Boolean(currentUser?.userID);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [promoSlides, setPromoSlides] = useState([]);
  const [promoSlidesLoading, setPromoSlidesLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/public/getHomeStats.php`);
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (err) {
        console.error("Error fetching home stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchTopDonors = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/public/getTopDonors.php`);
        const result = await response.json();
        if (result.success && result.data) {
          setTopDonors(result.data);
        }
      } catch (err) {
        console.error("Error fetching top donors:", err);
      } finally {
        setLoadingTopDonors(false);
      }
    };

    fetchStats();
    fetchTopDonors();
  }, []);

  useEffect(() => {
    if (location.state?.warningMessage) {
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (location.state?.shareStory) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await getComments();
        if (response.data?.success) {
          setComments(response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };

    fetchComments();
  }, []);

  const handleShareStoryClick = () => {
    if (isAuthenticated) {
      setIsCommentModalOpen(true);
      return;
    }

    navigate('/login', { state: { from: '/', shareStory: true } });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentError(null);

    if (!commentText.trim()) {
      setCommentError("Please share your story before saving.");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await submitComment(commentText.trim());

      if (!response.data?.success) {
        setCommentError(response.data?.message || "Unable to submit your story. Please try again.");
        return;
      }

      setCommentText("");
      setIsCommentModalOpen(false);
      setToast({ type: 'success', message: 'Comment added successfully.' });

      const refreshedComments = await getComments();
      if (refreshedComments.data?.success) {
        setComments(refreshedComments.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setCommentError(err.response?.data?.message || "Failed to share your story.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const closeCommentModal = () => {
    setIsCommentModalOpen(false);
    setCommentError(null);
    setCommentText("");
  };

  const commentCards = comments.slice(0, 2);

  const formatRoleLabel = (role) => {
    if (!role) return "Member";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const getAvatarUrl = (profilePhoto, fullName) => {
    if (profilePhoto) {
      return profilePhoto.startsWith('http') ? profilePhoto : `${BACKEND_URL}/${profilePhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  };

  // Slideshow auto-rotation
  useEffect(() => {
    if (isHovering || promoSlides.length <= 1) return; // Pause when hovering

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isHovering, promoSlides.length]);

  useEffect(() => {
    const fetchPromoSlides = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/public/getCommercializations.php`);
        const result = await response.json();
        if (result.success) {
          setPromoSlides(result.data || []);
          setCurrentSlide(0);
        }
      } catch (err) {
        console.error("Error fetching sponsor slides:", err);
      } finally {
        setPromoSlidesLoading(false);
      }
    };

    fetchPromoSlides();
  }, []);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await getProjects();
        if (response.data && response.data.success) {
          const now = new Date();
          const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          // Filter strictly active ongoing campaigns (active status, unreached goal, end date not passed)
          const rawData = response.data.data || [];
          const ongoingRecent = rawData.filter(p => {
            const raised = Number(p.raised || 0);
            const goal = Number(p.goal || 1);
            const isGoalMet = goal > 0 && raised >= goal;
            const isNotActive = p.status !== 'ACTIVE' && p.status !== 'APPROVED';
            const isEndDatePassed = Boolean(p.endDate && p.endDate < localToday);
            return !isGoalMet && !isNotActive && !isEndDatePassed;
          });

          // Sort by Near to Complete: Highest funding progress % first, followed by closest deadline
          const nearToComplete = [...ongoingRecent].sort((a, b) => {
            const goalA = Number(a.goal || 1);
            const raisedA = Number(a.raised || 0);
            const pctA = goalA > 0 ? (raisedA / goalA) : 0;

            const goalB = Number(b.goal || 1);
            const raisedB = Number(b.raised || 0);
            const pctB = goalB > 0 ? (raisedB / goalB) : 0;

            if (Math.abs(pctB - pctA) > 0.0001) {
              return pctB - pctA; // Highest percentage first
            }

            // Tiebreaker: nearest ending date
            const timeA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
            const timeB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
            if (timeA !== timeB) {
              return timeA - timeB;
            }

            return (b.id || b.projectID || 0) - (a.id || a.projectID || 0);
          });

          // Pick top 3 near-to-complete active ongoing campaigns
          setProjects(nearToComplete.slice(0, 3));
          setProjectError(null);
        } else {
          setProjectError(response.data.message || 'Unable to load ongoing campaigns.');
        }
      } catch (err) {
        console.error('Error fetching ongoing campaigns:', err);
        setProjectError('Unable to connect to the backend server. Please verify if MySQL and Apache are running.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  const handleGetStarted = () => {
    navigate('/register');
  }

  return (
    <div className="bg-slate-50 selection:bg-blue-600 min-h-screen selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        toast.type === 'success' ? (
          <div className="top-24 right-5 z-50 fixed flex items-center gap-3 bg-white/90 shadow-xl backdrop-blur-md px-5 py-4.5 border border-blue-200/80 rounded-2xl max-w-md text-slate-800 animate-slideIn">
            <span className="flex justify-center items-center bg-blue-100 p-2 rounded-xl text-blue-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-extrabold text-slate-900 text-sm">Success!</p>
              <p className="mt-0.5 font-semibold text-slate-500 text-xs leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="hover:bg-slate-100 ml-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="top-24 right-5 z-50 fixed flex items-center gap-3 bg-white/90 shadow-xl backdrop-blur-md px-5 py-4.5 border border-amber-200/80 rounded-2xl max-w-md text-slate-800 animate-slideIn">
            <span className="flex justify-center items-center bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-extrabold text-slate-900 text-sm">Pending Approval!</p>
              <p className="mt-0.5 font-semibold text-slate-500 text-xs leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="hover:bg-slate-100 ml-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative flex items-center bg-gradient-to-b from-blue-50/40 via-slate-50 to-slate-50 pt-18 pb-16 min-h-[92vh] overflow-hidden">
        {/* Glow Effects */}
        <div className="top-1/4 -left-20 absolute bg-blue-300/10 blur-[100px] rounded-full w-96 h-96 pointer-events-none" />
        <div className="-right-20 bottom-10 absolute bg-indigo-300/15 blur-[120px] rounded-full w-[450px] h-[450px] pointer-events-none" />

        <div className="z-10 relative items-center gap-12 grid md:grid-cols-12 mx-auto px-8 max-w-7xl">

          {/* LEFT: CONTENT */}
          <div className="space-y-7 md:col-span-5 text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50/80 shadow-sm px-4 py-2 border border-blue-100/60 rounded-full">
              <span className="relative flex w-2 h-2">
                <span className="inline-flex absolute bg-blue-400 opacity-75 rounded-full w-full h-full animate-ping"></span>
                <span className="inline-flex relative bg-blue-500 rounded-full w-2 h-2"></span>
              </span>
              <span className="font-extrabold text-[11px] text-blue-600 uppercase tracking-widest">
                Trusted by Sri Lankan Universities
              </span>
            </div>

            <h1 className="font-black text-slate-900 text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight">
              Transparent <br />
              <span className="bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-transparent">
                University Fundraising
              </span> <br />
              Platform.
            </h1>

            <p className="max-w-xl font-medium text-slate-500 text-base sm:text-lg leading-relaxed">
              FundUp connects verified university student clubs, sports squads, and societies with donors globally to fuel innovation, charity, and community outreach.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/projects')}
                className="bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg px-7 py-4 rounded-2xl font-bold text-white text-sm hover:scale-[1.02] active:scale-97 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer"
              >
                Explore Campaigns
              </button>

              <button
                onClick={() => navigate('/register')}
                className="bg-white hover:bg-slate-50 shadow-sm px-7 py-4 border border-slate-200 hover:border-slate-300 rounded-2xl font-bold text-slate-700 text-sm hover:scale-[1.02] active:scale-97 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer"
              >
                Start a Campaign
              </button>
            </div>
          </div>

          {/* RIGHT: ILLUSTRATION */}
          <div className="relative flex justify-center md:col-span-7">
            <style>{`
              @keyframes float {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(0.5deg); }
                100% { transform: translateY(0px) rotate(0deg); }
              }
              .floating-hero { animation: float 6s ease-in-out infinite; }
            `}</style>

            <div className="relative w-full max-w-[600px]">
              {/* Decorative backplate */}
              <div className="-z-10 absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-indigo-600/5 blur-2xl rounded-[2.5rem]" />
              <img
                src={hero}
                alt="University fundraising"
                className="drop-shadow-xl w-full h-auto object-contain select-none floating-hero"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── PARTNER UNIVERSITIES MARQUEE ── */}
      <section className="relative bg-white py-6 border-slate-100 border-y overflow-hidden select-none">
        <style>{`
          @keyframes infinite-scroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-infinite-marquee {
            display: flex;
            width: max-content;
            animation: infinite-scroll 45s linear infinite;
          }
          .animate-infinite-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="relative flex items-center mx-auto px-4 max-w-[1400px]">
          <div className="hidden z-20 lg:flex items-center gap-2.5 bg-white shadow-[10px_0_15px_-3px_rgba(255,255,255,1)] py-2 pr-8 pl-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] shrink-0">
            Active Academic Partners
          </div>

          <div className="relative flex items-center w-full h-10 overflow-hidden">
            {/* Fade Gradients */}
            <div className="top-0 bottom-0 left-0 z-10 absolute bg-gradient-to-r from-white via-white/70 to-transparent w-24 pointer-events-none" />
            <div className="top-0 right-0 bottom-0 z-10 absolute bg-gradient-to-l from-white via-white/70 to-transparent w-24 pointer-events-none" />

            <div className="flex gap-20 pl-4 whitespace-nowrap animate-infinite-marquee">
              {[
                "University of Colombo", "University of Peradeniya",
                "University of Moratuwa", "University of Kelaniya",
                "University of Ruhuna", "University of Jaffna",
                "Uva Wellassa University", "Eastern University of Sri Lanka",
                "Sabaragamuwa University", "Rajarata University"
              ].map((uni, idx) => (
                <div key={`orig-${idx}`} className="flex items-center gap-2 font-bold text-slate-500 hover:text-blue-600 text-xs transition-colors duration-200 cursor-default">
                  <span className="opacity-40 grayscale text-base">🏛️</span> {uni}
                </div>
              ))}
              {[
                "University of Colombo", "University of Peradeniya",
                "University of Moratuwa", "University of Kelaniya",
                "University of Ruhuna", "University of Jaffna",
                "Uva Wellassa University", "Eastern University of Sri Lanka",
                "Sabaragamuwa University", "Rajarata University"
              ].map((uni, idx) => (
                <div key={`dup-${idx}`} className="flex items-center gap-2 font-bold text-slate-500 hover:text-blue-600 text-xs transition-colors duration-200 cursor-default">
                  <span className="opacity-40 grayscale text-base">🏛️</span> {uni}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="bg-white py-20">
        <ScrollReveal className="mx-auto px-8 max-w-7xl">
          <div className="bg-slate-50/50 shadow-sm p-10 md:p-12 border border-slate-100 rounded-[2.5rem]">
            <div className="gap-8 md:gap-4 grid grid-cols-2 md:grid-cols-4 md:divide-x divide-y md:divide-y-0 divide-slate-100/80">

              {/* Stat 1 */}
              <div className="flex flex-col justify-center items-center p-4 text-center">
                <span className="flex justify-center items-center h-12 font-black text-blue-600 text-3xl sm:text-4xl tracking-tight">
                  {statsLoading ? (
                    <div className="bg-blue-100/50 rounded-xl w-16 h-8 animate-pulse"></div>
                  ) : (
                    <CountUpStat end={stats.activeCampaigns} />
                  )}
                </span>
                <p className="mt-2 font-extrabold text-slate-400 text-xs uppercase tracking-wider">Active Campaigns</p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col justify-center items-center p-4 pt-8 md:pt-4 text-center">
                <span className="flex justify-center items-center h-12 font-black text-slate-800 text-3xl sm:text-4xl tracking-tight">
                  {statsLoading ? (
                    <div className="bg-slate-200/50 rounded-xl w-20 h-8 animate-pulse"></div>
                  ) : (
                    <CountUpStat end={stats.totalDonors} formatter={formatDonors} />
                  )}
                </span>
                <p className="mt-2 font-extrabold text-slate-400 text-xs uppercase tracking-wider">Total Donors</p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col justify-center items-center p-4 pt-8 md:pt-4 text-center">
                <span className="flex justify-center items-center h-12 font-black text-blue-600 text-3xl sm:text-4xl tracking-tight">
                  {statsLoading ? (
                    <div className="bg-blue-100/50 rounded-xl w-28 h-8 animate-pulse"></div>
                  ) : (
                    <CountUpStat end={stats.totalFundsRaised} formatter={formatFunds} />
                  )}
                </span>
                <p className="mt-2 font-extrabold text-slate-400 text-xs uppercase tracking-wider">Total Funds Raised</p>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col justify-center items-center p-4 pt-8 md:pt-4 text-center">
                <span className="flex justify-center items-center h-12 font-black text-slate-800 text-3xl sm:text-4xl tracking-tight">
                  {statsLoading ? (
                    <div className="bg-slate-200/50 rounded-xl w-16 h-8 animate-pulse"></div>
                  ) : (
                    <CountUpStat end={stats.universitiesSupported} />
                  )}
                </span>
                <p className="mt-2 font-extrabold text-slate-400 text-xs uppercase tracking-wider">Universities Pinned</p>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── SPONSOR / ADVERTISE SLIDESHOW ── */}
      <section className="bg-slate-50 py-20">
        <ScrollReveal className="mx-auto px-8 max-w-7xl">
          <div className="space-y-2 mx-auto mb-12 max-w-xl text-center">
            <span className="font-black text-[10px] text-indigo-600 uppercase tracking-widest">Premium Opportunities</span>
            <h2 className="font-black text-slate-900 text-3xl tracking-tight">
              Community & Brand Spotlights
            </h2>
            <p className="font-medium text-slate-500 text-xs sm:text-sm">
              We offer exclusive advertising space for organizations looking to sponsor campus projects.
            </p>
          </div>

          <div
            className="relative bg-white shadow-slate-100 shadow-xl mx-auto border border-slate-100 rounded-[2.5rem] w-full max-w-5xl overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="relative w-full min-h-[220px] aspect-[21/9]">
              {!promoSlidesLoading && promoSlides.length === 0 ? (
                <div className="flex justify-center items-center bg-slate-50 w-full h-full text-slate-500 text-sm">
                  No active sponsor promotions right now.
                </div>
              ) : (
                promoSlides.map((slide, index) => {
                  const mediaUrl = slide.mediaPath?.startsWith('http')
                    ? slide.mediaPath
                    : `${BACKEND_URL}/${slide.mediaPath}`;

                  return (
                    <div
                      key={slide.id || index}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                      {slide.mediaType === 'VIDEO' ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover select-none"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={slide.companyName || `Sponsor banner ${index + 1}`}
                          className="w-full h-full object-cover select-none"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Navigation Dots */}
            {promoSlides.length > 1 && (
              <div className="bottom-5 left-1/2 z-20 absolute flex gap-2.5 -translate-x-1/2 transform">
                {promoSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                      ? 'bg-white w-6 shadow-sm scale-110'
                      : 'bg-white/40 hover:bg-white/70 w-2'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Pause Hover Indicator overlay */}
            {isHovering && (
              <>
                <div className="right-4 bottom-4 z-20 absolute flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-slate-700/50 rounded-xl pointer-events-none">
                  <span className="relative flex w-2 h-2">
                    <span className="inline-flex absolute bg-amber-400 opacity-75 rounded-full w-full h-full animate-ping"></span>
                    <span className="inline-flex relative bg-amber-500 rounded-full w-2 h-2"></span>
                  </span>
                  <span className="font-bold text-[10px] text-white uppercase tracking-wider">Paused</span>
                </div>

                {promoSlides[currentSlide] && (
                  <div className="bottom-6 left-5 z-20 absolute bg-slate-950/40 shadow-2xl shadow-slate-900/20 backdrop-blur-3xl p-5 border border-white/20 rounded-[2rem] max-w-sm text-white">
                    <p className="mb-3 text-[10px] text-slate-300 uppercase tracking-[0.35em]">Sponsor Spotlight</p>
                    <h3 className="font-black text-lg leading-tight">{promoSlides[currentSlide].companyName || 'Featured Sponsor'}</h3>
                    <p className="mt-2 text-slate-200 text-sm leading-6">
                      Currently showing the active media card. Pause to discover the sponsor and website associated with this slide.
                    </p>
                    {promoSlides[currentSlide].websiteLink && (
                      <a
                        href={promoSlides[currentSlide].websiteLink.startsWith('http') ? promoSlides[currentSlide].websiteLink : `https://${promoSlides[currentSlide].websiteLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex justify-center items-center bg-white/10 hover:bg-white/20 mt-4 px-4 py-2 rounded-2xl font-bold text-white text-xs tracking-wide transition"
                      >
                        {promoSlides[currentSlide].websiteLink.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ── FEATURED CAMPAIGNS ── */}
      <section className="bg-white py-24">
        <ScrollReveal className="mx-auto px-8 max-w-7xl">

          <div className="flex sm:flex-row flex-col justify-between sm:items-end gap-6 mb-14">
            <div className="space-y-2 text-left">
              <span className="font-black text-[10px] text-blue-600 uppercase tracking-widest">Urgent Initiatives</span>
              <h2 className="font-black text-slate-900 text-3xl sm:text-4xl tracking-tight">
                Campaigns Near Their Goal
              </h2>
              <p className="font-medium text-slate-500 text-xs sm:text-sm">
                These student projects are closest to reaching their funding goal. Your contribution can help them succeed!
              </p>
            </div>

            <button
              onClick={() => navigate('/projects')}
              className="group flex items-center self-start sm:self-auto gap-1.5 font-bold text-blue-600 hover:text-blue-700 text-sm tracking-wide cursor-pointer"
            >
              View All Campaigns
              <span className="transition-transform group-hover:translate-x-1.5 duration-200">→</span>
            </button>
          </div>

          <div className="gap-8 grid md:grid-cols-3">
            {loadingProjects ? (
              <div className="col-span-3 bg-slate-50 p-16 border border-slate-100 rounded-3xl text-center">
                <div className="mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
                <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Loading ongoing campaigns...</p>
              </div>
            ) : projectError ? (
              <div className="col-span-3 bg-red-50 mx-auto p-12 border border-red-100 rounded-3xl max-w-md text-red-700 text-center">
                <p className="mb-1 font-bold">Failed to Load Ongoing Campaigns</p>
                <p className="font-semibold text-red-600/80 text-xs leading-relaxed">{projectError}</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="col-span-3 bg-slate-50 p-16 border border-slate-100/50 rounded-3xl text-slate-400 text-center">
                <p className="font-bold text-sm">No Active Ongoing Campaigns</p>
                <p className="mt-1 font-medium text-xs">Check back soon for newly submitted and approved student projects.</p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard key={project.id} camp={project} />
              ))
            )}
          </div>

        </ScrollReveal>
      </section>

      {/* ── TOP DONORS PODIUM ── */}
      <section className="relative bg-slate-50 py-24 overflow-hidden">
        {/* Ambient Blur */}
        <div className="top-1/2 left-1/2 absolute bg-indigo-200/10 blur-[140px] rounded-full w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <ScrollReveal className="z-10 relative mx-auto px-8 max-w-6xl">

          <div className="space-y-2 mb-16 text-center">
            <span className="font-black text-[10px] text-blue-600 uppercase tracking-widest">Our Benefactors</span>
            <h2 className="font-black text-slate-900 text-3xl sm:text-4xl tracking-tight">
              Top Contributors
            </h2>
            <p className="mx-auto max-w-md font-medium text-slate-500 text-xs sm:text-sm">
              Recognizing the philanthropic leaders driving change across our campus communities.
            </p>
            <div className="pt-3">
              <button
                onClick={() => navigate('/donors')}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-600 border border-blue-200/80 hover:border-blue-600 text-blue-700 hover:text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-sm hover:shadow-md hover:shadow-blue-200/50 cursor-pointer active:scale-95 transition-all duration-200"
              >
                View All Donors
                <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
              </button>
            </div>
          </div>

          {loadingTopDonors ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
              <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Loading top donors...</p>
            </div>
          ) : topDonors.length > 0 ? (
            <>
              {/* Podium Layout */}
              <div className="flex md:flex-row flex-col justify-center items-stretch gap-8 lg:gap-10 mb-14">

                {/* #2 Donor - Left */}
                {topDonors[1] && (
                  <div className="relative flex flex-col flex-1 items-center order-2 md:order-1 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-md mx-auto md:mt-12 p-6.5 border border-slate-100 rounded-3xl w-full max-w-[260px] text-center hover:scale-[1.01] transition-all duration-300">
                    <div className="-top-3.5 left-1/2 absolute bg-emerald-500 shadow-md px-3.5 py-1 rounded-full font-black text-[10px] text-white uppercase tracking-wider -translate-x-1/2">
                      2nd Place
                    </div>
                    <img
                      src={getAvatarUrl(topDonors[1].profilePhoto, topDonors[1].fullName)}
                      alt={topDonors[1].fullName}
                      className="mt-4 mb-4 rounded-full ring-4 ring-emerald-50 w-22 h-22 object-cover select-none"
                    />
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">{topDonors[1].fullName}</h3>
                    <p className="mt-1 mb-6 font-bold text-[11px] text-slate-400">{topDonors[1].affiliation || 'Donor'}</p>

                    <div className="flex flex-col items-center bg-[#F0FDF4] mt-auto px-3 py-4 border border-emerald-100/50 rounded-2xl w-full">
                      <span className="mb-1 font-bold text-[9px] text-emerald-600 uppercase tracking-[0.15em]">Lifetime Impact</span>
                      <span className="font-black text-emerald-700 text-lg">Rs. {topDonors[1].totalDonation.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* #1 Donor - Center (Featured Podium) */}
                {topDonors[0] && (
                  <div className="z-20 relative flex flex-col flex-1 items-center order-1 md:order-2 bg-white shadow-[0_12px_45px_rgba(99,102,241,0.06)] hover:shadow-lg mx-auto p-8 border border-indigo-100/60 rounded-[2rem] w-full max-w-[340px] text-center hover:scale-[1.01] transition-all duration-300">
                    <div className="-top-4 left-1/2 absolute flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md px-5 py-1.5 rounded-full font-black text-[10px] text-white uppercase tracking-widest -translate-x-1/2">
                      👑 1st Place
                    </div>
                    <img
                      src={getAvatarUrl(topDonors[0].profilePhoto, topDonors[0].fullName)}
                      alt={topDonors[0].fullName}
                      className="mt-5 mb-5 rounded-full ring-8 ring-blue-50/70 w-28 h-28 object-cover select-none"
                    />
                    <h3 className="font-black text-slate-800 text-xl leading-tight">{topDonors[0].fullName}</h3>
                    <p className="mt-1 mb-8 font-bold text-slate-400 text-xs">{topDonors[0].affiliation || 'Donor'}</p>

                    <div className="flex flex-col items-center bg-gradient-to-b from-blue-50/40 to-indigo-50/20 px-4 py-5.5 border border-blue-100/40 rounded-2xl w-full">
                      <span className="mb-1.5 font-extrabold text-[9px] text-blue-600 uppercase tracking-[0.2em]">Lifetime Impact</span>
                      <span className="font-black text-blue-600 text-2xl">Rs. {topDonors[0].totalDonation.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* #3 Donor - Right */}
                {topDonors[2] && (
                  <div className="relative flex flex-col flex-1 items-center order-3 md:order-3 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-md mx-auto md:mt-12 p-6.5 border border-slate-100 rounded-3xl w-full max-w-[260px] text-center hover:scale-[1.01] transition-all duration-300">
                    <div className="-top-3.5 left-1/2 absolute bg-amber-600 shadow-md px-3.5 py-1 rounded-full font-black text-[10px] text-white uppercase tracking-wider -translate-x-1/2">
                      3rd Place
                    </div>
                    <img
                      src={getAvatarUrl(topDonors[2].profilePhoto, topDonors[2].fullName)}
                      alt={topDonors[2].fullName}
                      className="mt-4 mb-4 rounded-full ring-4 ring-amber-50 w-22 h-22 object-cover select-none"
                    />
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">{topDonors[2].fullName}</h3>
                    <p className="mt-1 mb-6 font-bold text-[11px] text-slate-400">{topDonors[2].affiliation || 'Donor'}</p>

                    <div className="flex flex-col items-center bg-[#FFF7ED] mt-auto px-3 py-4 border border-amber-100/50 rounded-2xl w-full">
                      <span className="mb-1 font-bold text-[9px] text-amber-600 uppercase tracking-[0.15em]">Lifetime Impact</span>
                      <span className="font-black text-amber-700 text-lg">Rs. {topDonors[2].totalDonation.toLocaleString()}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Grid for Other Donors */}
              <div className="flex flex-wrap justify-center gap-6 mt-12">

                {/* Rank 4 */}
                {topDonors[3] && (
                  <div className="flex items-center gap-4 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.015)] hover:shadow-md px-6 py-4.5 border border-slate-100 rounded-[1.25rem] w-[290px] transition-shadow">
                    <div className="relative select-none shrink-0">
                      <img src={getAvatarUrl(topDonors[3].profilePhoto, topDonors[3].fullName)} className="rounded-full w-12 h-12 object-cover" alt={topDonors[3].fullName} />
                      <span className="-right-1 -bottom-1 absolute bg-slate-500 shadow-sm px-1.5 py-0.5 rounded-md font-black text-[8px] text-white">
                        4th
                      </span>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{topDonors[3].fullName}</h4>
                      <p className="font-bold text-[10px] text-slate-400">{topDonors[3].affiliation || 'Donor'}</p>
                      <p className="font-black text-slate-700 text-xs">Rs. {topDonors[3].totalDonation.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Rank 5 */}
                {topDonors[4] && (
                  <div className="flex items-center gap-4 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.015)] hover:shadow-md px-6 py-4.5 border border-slate-100 rounded-[1.25rem] w-[290px] transition-shadow">
                    <div className="relative select-none shrink-0">
                      <img src={getAvatarUrl(topDonors[4].profilePhoto, topDonors[4].fullName)} className="rounded-full w-12 h-12 object-cover" alt={topDonors[4].fullName} />
                      <span className="-right-1 -bottom-1 absolute bg-slate-500 shadow-sm px-1.5 py-0.5 rounded-md font-black text-[8px] text-white">
                        5th
                      </span>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{topDonors[4].fullName}</h4>
                      <p className="font-bold text-[10px] text-slate-400">{topDonors[4].affiliation || 'Donor'}</p>
                      <p className="font-black text-slate-700 text-xs">Rs. {topDonors[4].totalDonation.toLocaleString()}</p>
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="py-10 font-medium text-slate-500 text-sm text-center">
              No top donors available yet. Be the first to donate!
            </div>
          )}

        </ScrollReveal>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="bg-white py-24">
        <ScrollReveal className="mx-auto px-8 max-w-6xl">
          <div className="flex justify-end mb-5">
            <button
              onClick={handleShareStoryClick}
              className="group flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 text-sm tracking-wide cursor-pointer"
            >
              Share your story with the community
              <span className="transition-transform group-hover:translate-x-1.5 duration-200">→</span>
            </button>
          </div>

          <div className="space-y-2 mb-16 text-center">
            <span className="font-black text-[10px] text-blue-600 uppercase tracking-widest">Impact Stories</span>
            <h2 className="font-black text-slate-900 text-3xl sm:text-4xl tracking-tight">
              Community Voices
            </h2>
            <p className="mx-auto max-w-sm font-medium text-slate-500 text-xs sm:text-sm">
              Read how FundUp is transforming crowdfunding campaigns in academic circles.
            </p>
          </div>

          <div className="gap-8 grid md:grid-cols-2">
            {commentCards.length > 0 ? (
              commentCards.map((comment) => (
                <div key={comment.commentID} className="relative flex flex-col justify-between bg-slate-50/50 hover:bg-slate-50/80 hover:shadow-md p-8.5 border border-slate-100 rounded-3xl text-left transition-all duration-300">
                  <p className="relative font-semibold text-slate-600 text-sm sm:text-base leading-relaxed">
                    {comment.comment}
                  </p>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-slate-100 border-t">
                    <img
                      src={getAvatarUrl(comment.profilePhoto, comment.fullName)}
                      className="rounded-full w-12 h-12 object-cover select-none"
                      alt={comment.fullName}
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{comment.fullName}</h4>
                      <p className="mt-0.5 font-bold text-slate-400 text-xs">{formatRoleLabel(comment.role)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              [1, 2].map((index) => (
                <div key={index} className="relative flex flex-col justify-between bg-slate-50/50 opacity-80 p-8.5 border border-slate-100 rounded-3xl text-left transition-all duration-300">
                  <p className="relative font-semibold text-slate-600 text-sm sm:text-base leading-relaxed">
                    "No community stories are available yet. Share your experience to help shape FundUp's future."
                  </p>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-slate-100 border-t">
                    <div className="bg-slate-200 rounded-full w-12 h-12" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">FundUp Community</h4>
                      <p className="mt-0.5 font-bold text-slate-400 text-xs">Community Voice</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollReveal>
      </section>

      {isCommentModalOpen && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={closeCommentModal} />
          <div className="z-10 relative bg-white shadow-2xl border border-slate-200 rounded-[2rem] w-full max-w-3xl overflow-hidden">
            <div className="flex justify-between items-start gap-4 p-6 border-slate-200 border-b">
              <div>
                <p className="font-bold text-blue-600 text-sm uppercase tracking-[0.24em]">Share your story</p>
                <h3 className="mt-2 font-extrabold text-slate-900 text-2xl">Community Voices</h3>
                <p className="mt-2 text-slate-500 text-sm">Tell us what you think about FundUp and inspire others.</p>
              </div>
              <button
                type="button"
                onClick={closeCommentModal}
                className="hover:bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCommentSubmit} className="space-y-6 p-6 sm:p-8">
              <div className="gap-4 grid sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-500 text-xs uppercase tracking-[0.2em]">Name</label>
                  <input
                    type="text"
                    value={currentUser?.fullName || ""}
                    readOnly
                    className="bg-slate-50 mt-2 px-4 py-3 border border-slate-200 rounded-3xl focus:outline-none w-full text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 text-xs uppercase tracking-[0.2em]">Role</label>
                  <input
                    type="text"
                    value={currentUser?.role ? formatRoleLabel(currentUser.role) : ""}
                    readOnly
                    className="bg-slate-50 mt-2 px-4 py-3 border border-slate-200 rounded-3xl focus:outline-none w-full text-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 text-xs uppercase tracking-[0.2em]">What do you think about FundUp?</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={6}
                  className="bg-white mt-2 px-4 py-4 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-100 w-full text-slate-700 text-sm"
                  placeholder="Share your story with the community..."
                  required
                />
              </div>

              {commentError && (
                <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-3xl text-red-700 text-sm">
                  {commentError}
                </div>
              )}

              <div className="flex sm:flex-row flex-col sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCommentModal}
                  className="hover:bg-slate-100 px-6 py-3 border border-slate-200 rounded-3xl font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 px-6 py-3 rounded-3xl font-semibold text-white transition disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ALL DONORS LEADERBOARD MODAL ── */}
      {isLeaderboardModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-white border border-slate-100 shadow-2xl rounded-[2rem] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">🏆</span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Donors Leaderboard
                  </h3>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  Full list of philanthropists ranked by total lifetime contributions & contributor badges.
                </p>
              </div>
              <button
                onClick={() => setIsLeaderboardModalOpen(false)}
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 sm:p-6 pb-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search donor by name or bio..."
                  value={leaderboardSearch}
                  onChange={(e) => setLeaderboardSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Leaderboard Donors List */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {loadingAllDonors ? (
                <div className="py-20 text-center">
                  <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading ranked donors...</p>
                </div>
              ) : filteredLeaderboard.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-semibold text-sm">
                  No donors found matching your search.
                </div>
              ) : (
                filteredLeaderboard.map((donor, idx) => {
                  const rank = idx + 1;
                  const badge = getBadgeStyleAndLabel(donor.badgeLevel);
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 rounded-2xl border transition-all duration-200 gap-3 ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-50/60 via-amber-50/20 to-white border-amber-200/80 shadow-sm'
                          : rank === 2
                          ? 'bg-gradient-to-r from-slate-100/60 via-slate-50/20 to-white border-slate-200/80 shadow-sm'
                          : rank === 3
                          ? 'bg-gradient-to-r from-orange-50/60 via-orange-50/20 to-white border-orange-200/80 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          rank === 1 ? 'bg-amber-500 text-white shadow-md shadow-amber-200' :
                          rank === 2 ? 'bg-slate-400 text-white shadow-md shadow-slate-200' :
                          rank === 3 ? 'bg-orange-500 text-white shadow-md shadow-orange-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          #{rank}
                        </div>

                        {/* Avatar */}
                        <img
                          src={getAvatarUrl(donor.profilePhoto, donor.fullName)}
                          alt={donor.fullName}
                          className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
                        />

                        {/* Details */}
                        <div className="text-left space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">{donor.fullName}</h4>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black ${badge.bg}`}>
                              {badge.icon} {badge.label}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400">{donor.affiliation || 'Donor'}</p>
                        </div>
                      </div>

                      {/* Total Amount & Stats */}
                      <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Contribution</span>
                        <span className="block text-base font-black text-blue-600">Rs. {Number(donor.totalDonation).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Showing {filteredLeaderboard.length} ranked contributors</span>
              <button
                onClick={() => setIsLeaderboardModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── CTA CALL TO ACTION ── */}
      <section className="bg-slate-50 py-20">
        <ScrollReveal className="mx-auto px-8 max-w-6xl">
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 shadow-indigo-100/50 shadow-xl p-10 md:p-16 rounded-[2.5rem] overflow-hidden text-white text-center">
            {/* Background design accents */}
            <div className="top-0 right-0 absolute bg-white/5 blur-3xl rounded-full w-80 h-80 pointer-events-none" />
            <div className="bottom-0 left-0 absolute bg-black/10 blur-3xl rounded-full w-80 h-80 pointer-events-none" />

            <div className="z-10 relative space-y-6 mx-auto max-w-xl">
              <h2 className="font-black text-3xl sm:text-4xl leading-tight tracking-tight">
                Ready to make a difference?
              </h2>
              <p className="font-medium text-indigo-100 text-sm sm:text-base leading-relaxed">
                Join our growing network of donors, student groups, and academic partners today. Submit your first project or support a student campaign.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex justify-center items-center bg-white hover:bg-slate-50 shadow-md px-8 py-4.5 rounded-2xl font-extrabold text-indigo-700 text-sm hover:scale-[1.02] active:scale-97 transition-all cursor-pointer"
              >
                Get Started Today
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}

export default Home;