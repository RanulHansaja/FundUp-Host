import React from 'react';
import ProjectSortFilter from './ProjectSortFilter';

function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories = ['All Projects', 'Education', 'Sports', 'Charity', 'Health & Medical', 'Environment', 'Other'],
  campaignStatusTab = 'ongoing',
  setCampaignStatusTab,
  ongoingCount = 0,
  completedCount = 0,
  sortBy = 'latest',
  setSortBy
}) {
  return (
    <div className="space-y-4 sm:space-y-5 mx-auto w-full max-w-4xl lg:max-w-6xl">
      {/* 1. Centered Status Switcher (Ongoing vs Completed) */}
      {setCampaignStatusTab && (
        <div className="flex justify-center w-full">
          <div className="inline-flex bg-slate-200/60 p-1 border border-slate-200/80 rounded-2xl select-none max-w-full">
            <button
              type="button"
              onClick={() => setCampaignStatusTab('ongoing')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-black tracking-wide border transition-all duration-200 cursor-pointer ${
                campaignStatusTab === 'ongoing'
                  ? 'bg-white text-blue-600 border-white shadow-sm shadow-slate-200/80'
                  : 'bg-transparent text-slate-500 hover:text-slate-800 border-transparent'
              }`}
            >
              <span className="relative flex w-2 h-2 flex-shrink-0">
                <span className={`inline-flex absolute rounded-full w-full h-full animate-ping ${campaignStatusTab === 'ongoing' ? 'bg-blue-400 opacity-75' : 'bg-slate-400 opacity-0'}`} />
                <span className={`inline-flex relative rounded-full w-2 h-2 ${campaignStatusTab === 'ongoing' ? 'bg-blue-600' : 'bg-slate-400'}`} />
              </span>
              <span>Ongoing Campaigns</span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                campaignStatusTab === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {ongoingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCampaignStatusTab('completed')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-black tracking-wide border transition-all duration-200 cursor-pointer ${
                campaignStatusTab === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                  : 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/90 border-emerald-200/80'
              }`}
            >
              <span>🎉</span>
              <span>Completed Campaigns</span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                campaignStatusTab === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {completedCount}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Centered Sort Filter Controls */}
      {setSortBy && (
        <div className="flex justify-center w-full">
          <ProjectSortFilter sortBy={sortBy} setSortBy={setSortBy} />
        </div>
      )}

      {/* 3. Centered Search Input Box */}
      <div className="relative mx-auto w-full max-w-xl">
        <div className="left-0 absolute inset-y-0 flex items-center pl-4 pointer-events-none">
          <svg
            className="w-4.5 h-4.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search campaigns, organizers, or topics..."
          className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)] focus:shadow-[0_10px_25px_rgba(0,75,214,0.06)] py-3 sm:py-3.5 pr-4 pl-11 border border-slate-100 hover:border-slate-200 focus:border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-semibold text-slate-700 text-xs transition-all placeholder-slate-400/80"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. Centered Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-[#004bd6] text-white shadow-md shadow-blue-200/50'
                : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 border border-slate-200/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchFilters;
