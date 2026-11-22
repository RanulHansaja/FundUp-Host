import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getProjectDetails } from '../../services/authService';
import Navbar from './component/Navbar';
import DonateModal from './component/DonateModal';
import ReportModal from './component/ReportModal';

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'updates', 'donors'
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxItems, setLightboxItems] = useState([]);

  const openLightbox = (index, rawItems) => {
    const formatted = rawItems.map((item) => {
      let p = typeof item === 'string' ? item : item.path;
      if (p && (p.startsWith('uploads/') || p.startsWith('/uploads/'))) {
        const clean = p.startsWith('/') ? p.substring(1) : p;
        p = `${import.meta.env.VITE_BACKEND_URL}/${clean}`;
      }
      const itemType = typeof item === 'object' && item.type ? item.type : '';
      const isVid = itemType === 'VIDEO' || (typeof p === 'string' && (p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.ogg') || p.includes('/videos/')));
      return {
        type: isVid ? 'VIDEO' : 'IMAGE',
        path: p
      };
    });
    setLightboxItems(formatted);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightboxItem = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxItems.length);
  };

  const prevLightboxItem = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxItems.length) % lightboxItems.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxItem();
      if (e.key === 'ArrowLeft') prevLightboxItem();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxItems.length]);

  const getLoggedInUser = () => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleDonateClick = (e) => {
    e.preventDefault();
    if (data && data.project) {
      const currentRaised = Number(data.project.collectedAmount || 0);
      const targetGoal = Number(data.project.targetAmount || 1);
      const isEndDatePassed = Boolean(data.project.endDate && new Date(data.project.endDate).setHours(23, 59, 59, 999) < Date.now());
      if (targetGoal > 0 && currentRaised >= targetGoal) {
        alert("This campaign has already reached its target funding goal.");
        return;
      }
      if (isEndDatePassed || data.project.status === 'COMPLETED') {
        alert("This campaign has reached its scheduled end date and is now closed to contributions.");
        return;
      }
    }
    const user = getLoggedInUser();
    if (!user) {
      alert("Please log in to support this project.");
      navigate('/login', {
        state: {
          from: location.pathname
        }
      });
      return;
    }
    if (user.role?.toUpperCase() !== 'DONOR') {
      alert("Only Donor accounts can make contributions. You are currently logged in as an " + user.role + ".");
      return;
    }
    setDonateModalOpen(true);
  };

  const handleReportClick = (e) => {
    e.preventDefault();
    const user = getLoggedInUser();
    if (!user) {
      alert("Please log in to report this project.");
      navigate('/login', {
        state: {
          from: location.pathname
        }
      });
      return;
    }
    setReportModalOpen(true);
  };

  const handleDonationSuccess = async () => {
    try {
      const response = await getProjectDetails(id);
      if (response.data && response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Error refreshing project details:', err);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await getProjectDetails(id);
        if (response.data && response.data.success) {
          setData(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to load project details.');
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Unable to retrieve project details. Please ensure the database is online.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#f8fafc] pt-24 min-h-screen">
        <Navbar />
        <div className="flex flex-col justify-center items-center gap-3 py-32">
          <div className="border-4 border-blue-600 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
          <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#f8fafc] pt-24 min-h-screen">
        <Navbar />
        <div className="mx-auto p-6 py-20 max-w-md text-center">
          <div className="bg-red-50 p-8 border border-red-100 rounded-3xl text-red-700">
            <span className="inline-flex bg-red-100 mb-4 p-3 rounded-full text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <h3 className="mb-2 font-extrabold text-lg">Error Loading Campaign</h3>
            <p className="mb-6 font-semibold text-red-600/80 text-xs leading-relaxed">{error || 'Campaign details not found.'}</p>
            <Link
              to="/projects"
              className="inline-block bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 px-6 py-3 rounded-2xl font-bold text-white text-xs transition-all duration-200"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { project, media, updates, donations } = data;

  // Resolve category banner fallbacks matching design cards
  let image = project.bannerImage;
  let useDatabasePath = false;
  if (image && (image.startsWith('uploads/') || image.startsWith('/uploads/'))) {
    const cleanPath = image.startsWith('/') ? image.substring(1) : image;
    image = `${import.meta.env.VITE_BACKEND_URL}/${cleanPath}`;
    useDatabasePath = true;
  }

  if (!useDatabasePath && (!image || image.includes('placeholder') || image.includes('project'))) {
    const category = (project.category || '').toLowerCase();
    if (category.includes('education')) {
      image = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop';
    } else if (category.includes('life') || category.includes('student')) {
      image = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop';
    } else if (category.includes('research')) {
      image = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop';
    } else if (category.includes('tech') || category.includes('technology')) {
      image = 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1200&auto=format&fit=crop';
    } else if (category.includes('community') || category.includes('charity')) {
      image = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop';
    } else {
      image = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop';
    }
  }

  const raised = Number(project.collectedAmount || 0);
  const goal = Number(project.targetAmount || 1);
  const isGoalReached = goal > 0 && raised >= goal;
  const rawPercentage = goal > 0 ? (raised / goal) * 100 : 0;
  const percentage = rawPercentage.toFixed(2);
  const barWidth = Math.min(rawPercentage, 100);

  // Time remaining calculation
  const endDateObj = new Date(project.endDate);
  const today = new Date();
  const diffTime = endDateObj - today;
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isEndDatePassed = Boolean(project.endDate && project.endDate < localToday);
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isCompleted = isGoalReached || isEndDatePassed || project.status === 'COMPLETED';

  const buttonText = 'Support Project';


  return (
    <>
      <div className="bg-slate-50 selection:bg-blue-600 pt-24 min-h-screen selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" />
        <Navbar />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link to="/projects" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700 text-xs transition-colors duration-150">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Campaigns
            </Link>
          </div>

          {/* 1. Large Banner Header */}
          <div className="relative bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)] mb-8 border border-slate-100 rounded-[2rem] overflow-hidden">
            <div className="relative h-[250px] md:h-[400px]">
              <img src={image} alt={project.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

              <div className="bottom-6 md:bottom-10 left-6 md:left-10 z-10 absolute text-white">
                <span className="inline-block bg-blue-600 shadow-sm px-3 py-1.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider">
                  {project.category}
                </span>
                <h1 className="mt-3 max-w-3xl font-extrabold text-2xl md:text-4xl leading-tight tracking-tight">
                  {project.title}
                </h1>
              </div>
            </div>
          </div>

          {/* 2. Content Layout Grid */}
          <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
            {/* Left Content Column */}
            <div className="space-y-8 lg:col-span-2">
              {/* Tab Navigation Menu */}
              <div className="flex border-slate-200 border-b">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`pb-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === 'about'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  About Project
                </button>
                <button
                  onClick={() => setActiveTab('updates')}
                  className={`pb-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === 'updates'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Updates ({updates.length})
                </button>
                <button
                  onClick={() => setActiveTab('donors')}
                  className={`pb-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === 'donors'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Backers ({donations.length})
                </button>
              </div>

              {/* Tab: About Project */}
              {activeTab === 'about' && (
                <div className="space-y-6 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.01)] p-6 md:p-8 border border-slate-100 rounded-3xl">
                  {project.shortSummary && (
                    <div className="bg-slate-50 p-6 border-blue-500 border-l-4 rounded-r-2xl">
                      <p className="font-semibold text-slate-600 text-sm italic leading-relaxed">
                        "{project.shortSummary}"
                      </p>
                    </div>
                  )}

                  <div className="max-w-none prose">
                    <h3 className="mb-4 font-extrabold text-slate-800 text-lg">Project Overview</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {project.description}
                    </p>
                  </div>

                  {/* Dynamic media gallery from ProjectMedia */}
                  {media.length > 0 && (
                    <div className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 text-sm tracking-tight">Campaign Gallery</h4>
                        <span className="text-[11px] font-semibold text-slate-400">Click any media to preview</span>
                      </div>
                      <div className="gap-4 grid grid-cols-2 md:grid-cols-3">
                        {media.map((item, index) => {
                          let path = item.path;
                          if (path && (path.startsWith('uploads/') || path.startsWith('/uploads/'))) {
                            const clean = path.startsWith('/') ? path.substring(1) : path;
                            path = `${import.meta.env.VITE_BACKEND_URL}/${clean}`;
                          }
                          const isVideo = item.type === 'VIDEO' || (typeof path === 'string' && (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg') || path.includes('/videos/')));
                          return (
                            <div
                              key={`${item.id || index}-${index}`}
                              onClick={() => openLightbox(index, media)}
                              className="group relative bg-slate-900 rounded-2xl aspect-video overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-slate-100/80"
                            >
                              {isVideo ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                                  <video
                                    src={path}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="w-12 h-12 rounded-full bg-white/95 group-hover:bg-white text-blue-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </span>
                                  </div>
                                  <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                                    🎬 Video
                                  </span>
                                </div>
                              ) : (
                                <div className="relative w-full h-full">
                                  <img
                                    src={path}
                                    alt="Project Media"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="w-10 h-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                      </svg>
                                    </span>
                                  </div>
                                  <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                                    📷 Photo
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Proposal PDF Action Button */}
                  {project.proposalPdfPath && (
                    <div className="flex flex-wrap justify-between items-center gap-4 bg-blue-50/50 p-6 border border-blue-100/50 rounded-2xl">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs">Official Project Proposal</h4>
                        <p className="text-[10px] text-slate-400">Read the full verified project breakdown</p>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_URL}/${project.proposalPdfPath.startsWith('/') ? project.proposalPdfPath.substring(1) : project.proposalPdfPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 px-5 py-2.5 border border-blue-200 rounded-xl font-bold text-blue-600 text-xs transition-all duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF Proposal
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Progress Updates */}
              {activeTab === 'updates' && (
                <div className="bg-white shadow-[0_4px_25px_rgba(0,0,0,0.01)] p-6 md:p-8 border border-slate-100 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-slate-800 text-lg">Organizer Updates</h3>
                    <span className="bg-blue-50 px-3 py-1 rounded-full font-extrabold text-blue-600 text-xs">
                      {updates.length} Update{updates.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {updates.length === 0 ? (
                    <div className="py-12 text-slate-400 text-xs text-center">
                      No progress updates have been posted for this project yet. Check back soon!
                    </div>
                  ) : (
                    <div className="relative space-y-8 ml-4 pl-6 border-slate-100 border-l-2">
                      {updates.map((update) => {
                        let img = update.image;
                        if (img && (img.startsWith('uploads/') || img.startsWith('/uploads/'))) {
                          const clean = img.startsWith('/') ? img.substring(1) : img;
                          img = `${import.meta.env.VITE_BACKEND_URL}/${clean}`;
                        }
                        return (
                          <div key={update.id} className="relative">
                            {/* Chronological bullet icon */}
                            <span className="top-1.5 -left-[33px] absolute flex justify-center items-center bg-blue-100 rounded-full ring-4 ring-white w-4 h-4">
                              <span className="bg-blue-600 rounded-full w-1.5 h-1.5" />
                            </span>

                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-[10px] text-slate-400">
                                  {new Date(update.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                {update.milestone && (
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 border border-indigo-100/80 rounded-full font-black text-[10px] text-indigo-700 uppercase tracking-wider">
                                    🎯 {update.milestone}
                                  </span>
                                )}
                                {update.progressPercent > 0 && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 border border-emerald-100/80 rounded-full font-black text-[10px] text-emerald-700 uppercase tracking-wider">
                                    📊 {update.progressPercent}% Stage Achieved
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-slate-800 text-base">{update.title}</h4>
                              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{update.description}</p>

                              {((update.imagePaths && update.imagePaths.length > 0) || (update.videoPaths && update.videoPaths.length > 0)) ? (
                                <div className="space-y-4">
                                  {update.imagePaths && update.imagePaths.length > 0 && (
                                    <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 max-w-2xl mt-4">
                                      {update.imagePaths.map((path, pIdx) => {
                                        let cleanPath = path.startsWith('/') ? path.substring(1) : path;
                                        let imgUrl = `${import.meta.env.VITE_BACKEND_URL}/${cleanPath}`;
                                        const updateImageItems = update.imagePaths.map(p => ({ type: 'IMAGE', path: p }));
                                        return (
                                          <div
                                            key={pIdx}
                                            onClick={() => openLightbox(pIdx, updateImageItems)}
                                            className="group relative bg-slate-100 rounded-xl overflow-hidden aspect-video border border-slate-100 shadow-sm block cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                          >
                                            <img src={imgUrl} alt={`Update Photo ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                              <span className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                                </svg>
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {update.videoPaths && update.videoPaths.length > 0 && (
                                    <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 max-w-2xl mt-4">
                                      {update.videoPaths.map((path, vIdx) => {
                                        let cleanPath = path.startsWith('/') ? path.substring(1) : path;
                                        let vidUrl = `${import.meta.env.VITE_BACKEND_URL}/${cleanPath}`;
                                        const updateVideoItems = update.videoPaths.map(p => ({ type: 'VIDEO', path: p }));
                                        return (
                                          <div
                                            key={vIdx}
                                            onClick={() => openLightbox(vIdx, updateVideoItems)}
                                            className="group relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                          >
                                            <video src={vidUrl} preload="metadata" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                              <span className="w-10 h-10 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z" />
                                                </svg>
                                              </span>
                                            </div>
                                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                                              🎬 Video
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                img && (
                                  <div
                                    onClick={() => openLightbox(0, [{ type: 'IMAGE', path: img }])}
                                    className="group shadow-sm mt-4 border border-slate-100 rounded-2xl max-w-lg overflow-hidden cursor-pointer relative aspect-video bg-slate-100"
                                  >
                                    <img src={img} alt={update.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <span className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Backers List */}
              {activeTab === 'donors' && (
                <div className="bg-white shadow-[0_4px_25px_rgba(0,0,0,0.01)] p-6 md:p-8 border border-slate-100 rounded-3xl">
                  <h3 className="mb-6 font-extrabold text-slate-800 text-lg">Recent Backers</h3>

                  {donations.length === 0 ? (
                    <div className="py-12 text-slate-400 text-xs text-center">
                      Be the first to back this campaign!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {donations.map((donation) => (
                        <div key={donation.id} className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex justify-center items-center bg-slate-100 rounded-full w-9 h-9 font-bold text-slate-600 text-xs uppercase">
                              {donation.donorName ? donation.donorName.substring(0, 2) : 'AN'}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs">
                                {donation.donorName || 'Anonymous'}
                              </h4>
                              <p className="font-bold text-[10px] text-slate-400">
                                {new Date(donation.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-emerald-600 text-xs">
                            +Rs. {donation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sticky Sidebar Column */}
            <div className="space-y-6">
              {/* Campaign Progress Card */}
              <div className="space-y-6 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] p-6 border border-slate-100 rounded-3xl">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-slate-800 text-2xl md:text-3xl">Rs. {raised.toLocaleString()}</span>
                    <span className="font-bold text-slate-400 text-xs">raised of Rs. {goal.toLocaleString()}</span>
                  </div>

                  {/* Visual Progress bar */}
                  <div className="bg-slate-100 mt-4 rounded-full w-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-full transition-all duration-700 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3 font-bold text-xs">
                    <span className="text-emerald-600">{percentage}% Complete</span>
                    <span className="text-slate-500">
                      {isEndDatePassed ? 'Campaign Ended' : `${diffDays} days left`}
                    </span>
                  </div>
                </div>

                {isGoalReached ? (
                  <div className="space-y-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm p-5 border border-emerald-200/80 rounded-2xl text-center">
                    <div className="flex justify-center items-center gap-2 font-black text-emerald-700 text-xs uppercase tracking-wider">
                      <span className="text-base">🎉</span> Goal Fully Funded
                    </div>
                    <p className="font-semibold text-[11px] text-emerald-600/90 leading-relaxed">
                      This campaign has successfully reached its required target amount. Thank you to all supporters!
                    </p>
                  </div>
                ) : isEndDatePassed || project.status === 'COMPLETED' ? (
                  <div className="space-y-1.5 bg-slate-50 shadow-sm p-5 border border-slate-200 rounded-2xl text-center">
                    <div className="flex justify-center items-center gap-2 font-black text-slate-700 text-xs uppercase tracking-wider">
                      <span className="text-base">⏳</span> Campaign Ended
                    </div>
                    <p className="font-semibold text-[11px] text-slate-500 leading-relaxed">
                      This campaign reached its scheduled end date ({project.endDate}). Contributions are now closed.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleDonateClick}
                    className="block bg-[#004bd6] hover:bg-[#0037a5] hover:shadow-blue-500/10 hover:shadow-lg py-4 rounded-2xl w-full font-black text-white text-xs text-center active:scale-[0.98] transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
                  >
                    {buttonText}
                  </button>
                )}
              </div>

              {/* Organizer Detail Card */}
              <div className="space-y-5 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] p-6 border border-slate-100 rounded-3xl">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Campaign Organizer</h4>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-extrabold text-slate-700 text-sm">{project.organizationName}</h5>
                    <p className="mt-0.5 text-[10px] text-slate-400">{project.universityName}</p>
                  </div>

                  <div className="divide-y divide-slate-50 font-bold text-[11px]">
                    <div className="flex items-center gap-3 py-2 text-slate-600">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {project.organizerName}
                    </div>
                    <div className="flex items-center gap-3 py-3 text-slate-600">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {project.organizerEmail}
                    </div>
                    {project.organizerPhone && (
                      <div className="flex items-center gap-3 py-3 text-slate-600">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 00.97.741h3.11a1 1 0 00.97-.741l.55-2.2a1 1 0 01.94-.725H19a2 2 0 012 2v3a2 2 0 01-2 2h-3.07a1 1 0 00-.97.741l-.55 2.2a1 1 0 00.97.741H19a2 2 0 012 2v5a2 2 0 01-2 2h-3.28a1 1 0 01-.94-.725l-.548-2.2a1 1 0 00-.97-.741h-3.11a1 1 0 00-.97.741l-.55 2.2a1 1 0 01-.94.725H5a2 2 0 01-2-2v-5a2 2 0 012-2h3.07a1 1 0 00.97-.741l.55-2.2a1 1 0 00-.97-.741H5a2 2 0 01-2-2V5z" />
                        </svg>
                        {project.organizerPhone}
                      </div>
                    )}
                  </div>

                  {project.socialMediaLink && (
                    <div className="pt-2">
                      <a
                        href={project.socialMediaLink.startsWith('http') ? project.socialMediaLink : `https://${project.socialMediaLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-black text-[#004bd6] text-[10px] hover:text-[#0037a5] uppercase tracking-wider transition-colors"
                      >
                        Social Media Links
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Campaign Action Button */}
              <div className="pt-4 text-center">
                <button
                  onClick={handleReportClick}
                  className="group inline-flex justify-center items-center gap-2 bg-red-50 hover:bg-red-100 shadow-sm hover:shadow px-4 py-3 border border-red-200/80 rounded-xl w-full font-bold text-red-600 hover:text-red-700 text-xs active:scale-[0.99] transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Report this Campaign
                </button>
              </div>
            </div>
          </div>
        </main>

        <DonateModal
          isOpen={donateModalOpen}
          onClose={() => setDonateModalOpen(false)}
          project={project}
          onDonationSuccess={handleDonationSuccess}
        />

        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          project={project}
        />

        {/* ── LIGHTBOX MEDIA PREVIEW MODAL ── */}
        {lightboxOpen && lightboxItems.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 select-none animate-in fade-in duration-200"
            onClick={closeLightbox}
          >
            {/* Top Bar: Counter & Close Button */}
            <div className="absolute top-5 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
              <span className="bg-black/60 text-white text-xs font-black px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 tracking-wider">
                {lightboxIndex + 1} / {lightboxItems.length} {lightboxItems[lightboxIndex]?.type === 'VIDEO' ? '• Video' : '• Photo'}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                className="bg-black/60 hover:bg-red-600/90 text-white p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105 cursor-pointer shadow-lg"
                title="Close (Esc)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Left Arrow Button */}
            {lightboxItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightboxItem();
                }}
                className="absolute left-4 sm:left-8 z-20 bg-black/60 hover:bg-black/90 text-white p-3.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 cursor-pointer shadow-xl"
                title="Previous (Left Arrow)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Media Content Box */}
            <div
              className="relative max-h-[85vh] max-w-[92vw] flex items-center justify-center z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxItems[lightboxIndex]?.type === 'VIDEO' ? (
                <video
                  key={lightboxItems[lightboxIndex]?.path}
                  src={lightboxItems[lightboxIndex]?.path}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl bg-black border border-white/15 object-contain"
                />
              ) : (
                <img
                  key={lightboxItems[lightboxIndex]?.path}
                  src={lightboxItems[lightboxIndex]?.path}
                  alt="Campaign Media Full View"
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/15"
                />
              )}
            </div>

            {/* Right Arrow Button */}
            {lightboxItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightboxItem();
                }}
                className="absolute right-4 sm:right-8 z-20 bg-black/60 hover:bg-black/90 text-white p-3.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 cursor-pointer shadow-xl"
                title="Next (Right Arrow)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ProjectDetails;
