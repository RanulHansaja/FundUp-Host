import { useState, useEffect } from 'react';
import { getProjects } from '../../services/authService';
import ProjectCard from '../common/component/ProjectCard';
import SearchFilters from '../common/component/SearchFilters';

function BrowseProjects() {
  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const [campaignStatusTab, setCampaignStatusTab] = useState('ongoing'); // 'ongoing' or 'completed'
  const [sortBy, setSortBy] = useState('latest');

  const categories = ['All Projects', 'Education', 'Sports', 'Charity', 'Health & Medical', 'Environment', 'Other'];

  const fetchAllProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await getProjects();
      if (response.data && response.data.success) {
        setAllProjects(response.data.data || []);
        setProjectsError(null);
      } else {
        setProjectsError(response.data.message || 'Failed to load projects.');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjectsError('Unable to connect to the backend server. Please verify if MySQL and Apache are running.');
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchAllProjects();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Helper check for completed/ended/suspended status
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
  const ongoingCount = allProjects.filter(p => !checkIsCompleted(p)).length;
  const completedCount = allProjects.filter(p => checkIsCompleted(p)).length;

  // Filter projects by status tab, category, and search query
  const filteredProjects = allProjects.filter(project => {
    const isCompleted = checkIsCompleted(project);

    // 1. Status Tab filter
    if (campaignStatusTab === 'ongoing' && isCompleted) return false;
    if (campaignStatusTab === 'completed' && !isCompleted) return false;

    // 2. Search query filter (with safe null checks)
    const titleStr = (project.title || '').toLowerCase();
    const orgStr = (project.organizationName || '').toLowerCase();
    const catStr = (project.category || '').toLowerCase();
    const descStr = (project.description || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch =
      titleStr.includes(query) ||
      orgStr.includes(query) ||
      catStr.includes(query) ||
      descStr.includes(query);

    if (!matchesSearch) return false;

    // 3. Category filter
    if (selectedCategory === 'All Projects') {
      return true;
    }

    const catLower = catStr;
    const selLower = (selectedCategory || '').toLowerCase();

    if (selLower === 'education') {
      return catLower.includes('education') || catLower.includes('academic') || catLower.includes('infrastructure') || catLower.includes('research') || catLower.includes('tech');
    } else if (selLower === 'sports') {
      return catLower.includes('sport') || catLower.includes('athletic') || catLower.includes('game');
    } else if (selLower === 'charity') {
      return catLower.includes('charity') || catLower.includes('welfare') || catLower.includes('stray') || catLower.includes('animal') || catLower.includes('foster') || catLower.includes('community');
    } else if (selLower === 'health & medical') {
      return catLower.includes('health') || catLower.includes('medical') || catLower.includes('hospital') || catLower.includes('care');
    } else if (selLower === 'environment') {
      return catLower.includes('environment') || catLower.includes('green') || catLower.includes('nature') || catLower.includes('sustainability') || catLower.includes('agriculture');
    } else if (selLower === 'other') {
      return catLower.includes('other') || (!catLower.includes('education') && !catLower.includes('sport') && !catLower.includes('charity') && !catLower.includes('health') && !catLower.includes('environment'));
    } else {
      return catLower.includes(selLower);
    }
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // In Completed tab: Prioritize 100%+ Goal Reached campaigns first
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

  return (
    <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
      {/* ── HEADER ── */}
      <div className="space-y-1 text-left">
        <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
          Browse Projects
        </h1>
        <p className="font-semibold text-slate-400 text-xs md:text-sm">
          Explore and support verified university campaigns across Sri Lanka.
        </p>
      </div>

      {/* Search & Filters Component */}
      <div className="bg-white shadow-sm p-6 border border-slate-100 rounded-3xl">
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

      {/* Campaigns Grid / States */}
      {projectsLoading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <div className="border-4 border-blue-500 border-t-transparent rounded-full w-9 h-9 animate-spin"></div>
          <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Loading campaigns...</p>
        </div>
      ) : projectsError ? (
        <div className="bg-red-50 p-8 border border-red-100 rounded-3xl text-center text-red-700 max-w-md mx-auto">
          <h3 className="mb-2 font-extrabold text-lg">Error loading projects</h3>
          <p className="mb-4 text-xs font-semibold">{projectsError}</p>
          <button
            onClick={fetchAllProjects}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-2xl active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h2 className="font-bold text-slate-800 text-lg tracking-tight">
              {campaignStatusTab === 'ongoing' ? 'Active Ongoing Campaigns' : '🎉 Completed & Suspended Campaigns'}
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
                No {campaignStatusTab === 'ongoing' ? 'Ongoing' : 'Completed/Suspended'} Campaigns Found
              </h3>
              <p className="mx-auto mt-1 max-w-xs font-semibold text-slate-400 text-xs leading-relaxed">
                We couldn't find any projects matching your current filters.
              </p>
            </div>
          ) : (
            <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project) => (
                <ProjectCard key={project.id || project.projectID} camp={project} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BrowseProjects;
