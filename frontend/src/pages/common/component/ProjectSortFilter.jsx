import React from 'react';

function ProjectSortFilter({ sortBy = 'latest', setSortBy }) {
  return (
    <div className="flex items-center justify-center gap-2 select-none">
      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
        Sort:
      </span>
      <div className="inline-flex bg-slate-200/50 p-1 border border-slate-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => setSortBy && setSortBy('latest')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
            sortBy === 'latest'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 border border-transparent'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Latest Projects
        </button>

        <button
          type="button"
          onClick={() => setSortBy && setSortBy('ending_soon')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
            sortBy === 'ending_soon'
              ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 border border-transparent'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Near to Finish Date
        </button>
      </div>
    </div>
  );
}

export default ProjectSortFilter;
