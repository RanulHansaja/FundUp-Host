import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './component/Navbar';
import Footer from "./component/Footer";
import { getUniversities } from '../../services/authService';

const About = () => {
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [universityError, setUniversityError] = useState(null);

  const colors = [
    'from-slate-200 to-slate-400',
    'from-sky-200 to-sky-500',
    'from-emerald-200 to-emerald-500',
    'from-violet-200 to-violet-500',
    'from-fuchsia-200 to-fuchsia-500',
    'from-amber-200 to-amber-500',
    'from-rose-200 to-rose-500',
    'from-cyan-200 to-cyan-500',
    'from-teal-200 to-teal-500',
    'from-indigo-200 to-indigo-500',
  ];

  const getInitials = (name) => {
    if (!name) return '';
    const mappings = {
      'uva wellassa university': 'UWU',
      'university of colombo': 'UOC',
      'university of peradeniya': 'UOP',
      'university of moratuwa': 'UOM',
      'university of sri jayewardenepura': 'USJ',
      'university of kelaniya': 'UOK',
      'university of ruhuna': 'UOR',
      'eastern university of sri lanka': 'EUSL',
      'eastern university, sri lanka': 'EUSL',
      'south eastern university of sri lanka': 'SEUSL',
      'sabaragamuwa university of sri lanka': 'SUSL',
      'wayamba university of sri lanka': 'WUSL',
      'rajarata university of sri lanka': 'RUSL',
      'university of jaffna': 'UOJ',
      'university of vavuniya': 'UOV',
      'open university of sri lanka': 'OUSL',
      'university of the visual and performing arts': 'UVPA',
    };
    const key = name.toLowerCase().trim();
    if (mappings[key]) return mappings[key];

    return name
      .split(/[\s-]+/)
      .filter(word => !['of', 'the', 'and', 'for', 'to'].includes(word.toLowerCase()))
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const response = await getUniversities();
        if (Array.isArray(response.data)) {
          setUniversities(response.data);
          setUniversityError(null);
        } else {
          setUniversityError('Failed to load universities.');
        }
      } catch (err) {
        console.error('Error fetching universities:', err);
        setUniversityError('Unable to load universities.');
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  const values = [
    {
      title: 'Absolute Security',
      description: 'We manually moderate and approve every single uploaded bank slip to prevent duplicate uploads or Photoshop fraud.',
      icon: '🔒',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Student-First Focus',
      description: 'Tailored specifically for Sri Lankan university clubs, societies, charity events, and educational workshops.',
      icon: '🎓',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Full Transparency',
      description: 'Watch live campaign stats and download final reports to see exactly where and how every single rupee is spent.',
      icon: '📊',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Direct Transfers',
      description: 'Funds bypass intermediaries and are directly deposited to registered official student association bank accounts.',
      icon: '🤝',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const roles = [
    {
      title: 'Admin',
      description: 'Verifies organizers, manages user trust, and keeps the funding network safe with campus-level approvals.',
      icon: '🛡️',
    },
    {
      title: 'Organizer',
      description: 'Creates campaigns, updates progress, and engages donors with real-time stories from university initiatives.',
      icon: '🎯',
    },
    {
      title: 'Donor',
      description: 'Supports projects, tracks every contribution, and receives recognition for helping campus communities grow.',
      icon: '🤝',
    },
  ];

  const impacts = [
    {
      title: 'Trust',
      description: 'Verified organizers and transparent reporting make every donation accountable and reliable.',
      icon: '🔍',
    },
    {
      title: 'Accountability',
      description: 'Live tracking and fund utilization updates keep university stakeholders informed at every step.',
      icon: '📈',
    },
    {
      title: 'Community',
      description: 'Students, alumni, and sponsors collaborate to deliver meaningful social and academic impact.',
      icon: '🌱',
    },
    {
      title: 'Growth',
      description: 'A centralized platform helps campaigns scale faster and reach more supporters across Sri Lankan campuses.',
      icon: '🚀',
    },
  ];

  return (
    <>
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-white relative overflow-hidden">
      <Navbar />
      
      {/* Dynamic Animated Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2.5s' }} />

      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block bg-sky-50 text-sky-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100 uppercase tracking-wider">
            🌍 Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Empowering the Next Generation of <span className="text-blue-600">Changemakers</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            FundUp is Sri Lanka's first centralized, trackable, and university-approved crowdfunding platform built specifically for academic clubs, events, welfare funds, and social services.
          </p>
        </div>
      </section>

      {/* Grid: Mission and Vision Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mission Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 select-none pointer-events-none">🚀</div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">🚀</span>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Our Mission</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              To dismantle fundraising barriers for state university student communities by providing a highly secure, transparent, and user-friendly digital portal. We aim to connect inspired student organizers directly with generous alumni and sponsors across the globe to secure verified funding for impactful projects.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 select-none pointer-events-none">👁️</div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">👁️</span>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Our Vision</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              To establish a nationally recognized, trust-based digital fundraising ecosystem in Sri Lanka, where every academic association, social welfare club, and student startup is fully equipped to fund their noble causes securely, while providing sponsors and backers with complete visibility and tracking on every donation made.
            </p>
          </div>

        </div>
      </section>

      {/* Values Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Pillars of Our Platform</h2>
          <p className="text-slate-500 text-sm">
            Built from scratch to solve local university banking and donation tracking challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((val, idx) => (
            <div 
              key={idx}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${val.color} rounded-2xl flex items-center justify-center text-2xl shadow-md text-white mb-5 transform group-hover:scale-110 transition-transform duration-300`}>
                {val.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2.5">
                {val.title}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed flex-grow">
                {val.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Who Uses FundUp? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Who Uses FundUp?</h2>
          <p className="text-slate-500 text-sm">
            Designed for everyone in the university funding ecosystem — from admins and organizers to donors and supporters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role, idx) => (
            <div key={idx} className="bg-white/85 rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl mb-5 shadow-sm">
                {role.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{role.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why FundUp Matters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Why FundUp Matters</h2>
          <p className="text-slate-500 text-sm">
            Every feature is built to strengthen trust, simplify giving, and accelerate university project success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {impacts.map((item, idx) => (
            <div key={idx} className="bg-white/85 rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-2xl mb-5 shadow-sm">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Affiliated University Logos */}
      <section className="bg-white py-20 relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Affiliated Universities</h2>
          <p className="text-slate-500 text-sm mt-2">
            Trusted by student organizations across Sri Lanka's leading universities.
          </p>
        </div>

        <div className="w-full overflow-hidden mask-gradient relative py-6">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: marquee 65s linear infinite;
              gap: 5rem;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
            .mask-gradient {
              mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
              -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
          `}</style>

          {loadingUniversities ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Loading Universities...
            </div>
          ) : universityError ? (
            <div className="py-8 text-center text-red-500 text-xs font-semibold uppercase tracking-wider">
              {universityError}
            </div>
          ) : universities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
              No affiliated universities found.
            </div>
          ) : (
            <div className="animate-marquee">
              {[...universities, ...universities, ...universities, ...universities].map((uni, idx) => {
                const badge = getInitials(uni.universityName);
                const color = colors[idx % colors.length];
                return (
                  <div 
                    key={`${uni.domainID}-${idx}`}
                    className="flex flex-col items-center gap-3 w-36 text-center select-none cursor-pointer group shrink-0"
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-sm md:text-base font-bold text-slate-900 shadow-inner transition-all duration-300 group-hover:scale-108 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] relative`}> 
                      {badge}
                    </div>
                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-800 transition-colors duration-300 max-w-[120px] leading-snug">
                      {uni.universityName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10 border border-slate-800 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full filter blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Join the FundUp Movement Today
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Whether you want to support student charity initiatives or set up your own club fundraising page, we have got you covered.
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link 
                to="/register" 
                className="bg-sky-600 text-center hover:bg-sky-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-sky-500/15 animate-pulse"
              >
                Sign Up Now
              </Link>
              <Link 
                to="/projects" 
                className="bg-slate-800 text-center hover:bg-slate-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all border border-slate-700"
              >
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      
    </div>
    <Footer/>
    </>
  );
};

export default About;
