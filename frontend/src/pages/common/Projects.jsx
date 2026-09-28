import { useState, useEffect } from 'react';

import Navbar from './component/Navbar';
import ProjectCard from './component/ProjectCard';
import SearchFilters from './component/SearchFilters';
import { getProjects } from '../../services/authService';
import Footer from "./component/Footer"

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const [campaignStatusTab, setCampaignStatusTab] = useState('ongoing'); // 'ongoing' or 'completed'
  const [sortBy, setSortBy] = useState('latest'); // 'latest' or 'ending_soon'

  const categories = ['All Projects', 'Education', 'Sports', 'Charity', 'Health & Medical', 'Environment', 'Other'];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects();
        if (response.data && response.data.success) {
          setProjects(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to load projects.');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Unable to connect to the backend server. Please verify if MySQL and Apache are running.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Helper check for completed status
  const checkIsCompleted = (project) => {
    if (project.status === 'SUSPENDED') {
      return false;
    }
    const raised = Number(project.raised || 0);
    const goal = Number(project.goal || 0);
    const isGoalMet = goal > 0 && raised >= goal;
    const isCompletedStatus = project.status === 'COMPLETED' || project.status === 'REJECTED';
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isEndDatePassed = Boolean(project.endDate && project.endDate < localToday);
    return isGoalMet || isCompletedStatus || isEndDatePassed;
  };

  // Counts for status switcher
  const ongoingCount = projects.filter(p => !checkIsCompleted(p)).length;
  const completedCount = projects.filter(p => checkIsCompleted(p)).length;

  // Filter projects by status tab, category, and search query
  const filteredProjects = projects.filter(project => {
    const isCompleted = checkIsCompleted(project);

    // 1. Status Tab filter
    if (campaignStatusTab === 'ongoing' && isCompleted) return false;
    if (campaignStatusTab === 'completed' && !isCompleted) return false;

    // 2. Search query filter
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 3. Category filter
    if (selectedCategory === 'All Projects') {
      return true;
    }

    const catLower = project.category.toLowerCase();
    const selLower = selectedCategory.toLowerCase();

    if (selLower === 'education') {
      return catLower.includes('education') || catLower.includes('academic') || catLower.includes('infrastructure') || catLower.includes('research') || catLower.includes('tech');
    } else if (selLower === 'sports') {
      return catLower.includes('sport') || catLower.includes('athletic') || catLower.includes('game');
    } else if (selLower === 'charity') {
      return catLower.includes('charity') || catLower.includes('welfare') || catLower.includes('stray') || catLower.includes('animal') || catLower.includes('foster') || catLower.includes('community');
    } else if (selLower === 'health & medical') {
      return catLower.includes('health') || catLower.includes('medical') || catLower.includes('hospital') || catLower.includes('care');
    } else if (selLower === 'environment') {
      return catLower.includes('environment') || catLower.includes('green') || catLower.includes('nature') || catLower.includes('sustainability');
    } else if (selLower === 'other') {
      return catLower.includes('other') || (!catLower.includes('education') && !catLower.includes('sport') && !catLower.includes('charity') && !catLower.includes('health') && !catLower.includes('environment'));
    } else {
      return catLower.includes(selLower);
    }
  });

  // Sort projects:
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // In Completed tab: Prioritize 100%+ Goal Reached campaigns to the TOP, and other ended projects to the bottom
    if (campaignStatusTab === 'completed') {
      const goalA = Number(a.goal || 0);
      const raisedA = Number(a.raised || 0);
      const isGoalReachedA = goalA > 0 && raisedA >= goalA;

      const goalB = Number(b.goal || 0);
      const raisedB = Number(b.raised || 0);
      const isGoalReachedB = goalB > 0 && raisedB >= goalB;

      if (isGoalReachedA && !isGoalReachedB) return -1;
      if (!isGoalReachedA && isGoalReachedB) return 1;
    }

    if (sortBy === 'ending_soon') {
      const timeA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const timeB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      if (timeA === timeB) {
        return (b.id || b.projectID || 0) - (a.id || a.projectID || 0);
      }
      return timeA - timeB;
    }
    // Default: 'latest' (newest project ID first)
    return (b.id || b.projectID || 0) - (a.id || a.projectID || 0);
  });

  if (loading) {
    return (
      <div className="bg-[#f8fafc] pt-24 min-h-screen">
        <Navbar />
        <div className="flex flex-col justify-center items-center gap-3 py-32">
          <div className="border-4 border-blue-600 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
          <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
            <h3 className="mb-2 font-extrabold text-lg">Failed to connect database</h3>
            <p className="mb-6 font-semibold text-red-600/80 text-xs leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 px-6 py-3 rounded-2xl font-bold text-white text-xs active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Reconnect Database
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-slate-50 selection:bg-blue-600 pt-24 min-h-screen selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Dynamic Font Loader for Premium Typography */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── GRADIENT HEADER ── */}
        <div className="relative bg-gradient-to-tr from-blue-50/50 via-white to-emerald-50/50 shadow-sm mb-8 sm:mb-12 p-4 sm:p-8 md:p-14 border border-slate-100/80 rounded-2xl sm:rounded-[2.5rem] overflow-hidden text-center select-none">
          {/* Abstract ambient decorative blobs */}
          <div className="-top-12 -left-12 absolute bg-blue-300/10 blur-2xl rounded-full w-48 h-48 pointer-events-none" />
          <div className="-right-12 -bottom-12 absolute bg-emerald-300/10 blur-3xl rounded-full w-64 h-64 pointer-events-none" />

          <div className="z-10 relative space-y-3 sm:space-y-4 mx-auto max-w-3xl">
            <h1 className="font-extrabold text-blue-600 text-2xl sm:text-3xl md:text-5xl leading-tight tracking-tight">
              Support Meaningful University Projects
            </h1>
            <p className="mx-auto mb-4 sm:mb-6 max-w-lg font-semibold text-slate-500 text-xs sm:text-sm leading-relaxed">
              Discover and fund initiatives that shape the future of our campus and community.
            </p>

            <SearchFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              campaignStatusTab={campaignStatusTab}
              setCampaignStatusTab={setCampaignStatusTab}
              ongoingCount={ongoingCount}
              completedCount={completedCount}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>
        </div>

        {/* ── FEATURED CAMPAIGNS GRID ── */}
        <div className="space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h2 className="font-bold text-slate-800 text-lg sm:text-xl tracking-tight">
              {campaignStatusTab === 'ongoing' ? 'Active Ongoing Campaigns' : '🎉 Successfully Funded & Completed Campaigns'}
            </h2>
            <span className="font-bold text-slate-400 text-xs">
              Showing {sortedProjects.length} campaign{sortedProjects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {sortedProjects.length === 0 ? (
            <div className="bg-white shadow-sm p-12 border border-slate-100 rounded-[2rem] text-center">
              <span className="inline-flex bg-slate-50 mb-4 p-4 border border-slate-100 rounded-3xl text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h3 className="font-extrabold text-slate-800 text-base">
                No {campaignStatusTab === 'ongoing' ? 'Ongoing' : 'Completed'} Campaigns Found
              </h3>
              <p className="mx-auto mt-1 max-w-xs font-semibold text-slate-400 text-xs leading-relaxed">
                We couldn't find any {campaignStatusTab} projects matching your current category/search filters.
              </p>
            </div>
          ) : (
            <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project) => (
                <ProjectCard key={project.id} camp={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
    <Footer/>
    </>
  );
}

export default Projects;