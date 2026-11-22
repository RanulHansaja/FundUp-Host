import { Link } from 'react-router-dom';

const ProjectCard = ({ camp }) => {
  // Safe extraction of properties supporting both frontend mockup keys and database columns
  const id = camp.id || camp.projectID;
  const title = camp.title || camp.project_name || camp.name || '';
  const description = camp.description || camp.shortSummary || camp.project_description || '';

  const raised = Number(camp.raised !== undefined ? camp.raised : (camp.collectedAmount !== undefined ? camp.collectedAmount : camp.current_amount)) || 0;
  const goal = Number(camp.goal !== undefined ? camp.goal : (camp.targetAmount !== undefined ? camp.targetAmount : camp.goal_amount)) || 1; // Prevent division by zero
  const isGoalReached = goal > 0 && raised >= goal;
  const endDate = camp.endDate || camp.end_date;
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isEndDatePassed = Boolean(endDate && endDate < localToday);
  const isCompleted = isGoalReached || isEndDatePassed || camp.status === 'COMPLETED';

  const rawPercentage = goal > 0 ? (raised / goal) * 100 : 0;
  const percentage = rawPercentage.toFixed(2);
  const barWidth = Math.min(rawPercentage, 100);
  const isSuspended = camp.status === 'SUSPENDED';

  // Dynamic category tag from database with unified single color
  const projectCategory = camp.category || camp.tag || 'Other';
  const tag = projectCategory.toUpperCase();
  const tagColor = 'bg-[#fef2e9] text-[#ea580c] border border-orange-100/60';

  // Handle local server uploads path and category-specific Unsplash fallbacks for a beautiful UI/UX
  let image = camp.image || camp.bannerImage || camp.image_url;
  let useDatabasePath = false;
  if (image && (image.startsWith('uploads/') || image.startsWith('/uploads/'))) {
    const cleanPath = image.startsWith('/') ? image.substring(1) : image;
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'https://fundup-backend-cbfbh7d5gtdscxgg.southafricanorth-01.azurewebsites.net').replace(/\/$/, '');
    image = `${backendUrl}/${cleanPath}`;
    useDatabasePath = true;
  }

  if (!useDatabasePath && (!image || image.includes('placeholder') || image.includes('Educational Support Fundraiser.png') || image.includes('project1.jpg') || image.includes('project2.jpg') || image.includes('project3.jpg') || image.includes('project4.jpg') || image.includes('project5.jpg') || image.includes('project6.jpg'))) {
    const catLower = projectCategory.toLowerCase();
    const tagLower = (tag || '').toLowerCase();

    if (catLower.includes('education') || tagLower.includes('infrastructure')) {
      image = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop'; // Modern student learning space
    } else if (catLower.includes('life') || tagLower.includes('student')) {
      image = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'; // Group of student leaders
    } else if (catLower.includes('event') || tagLower.includes('program') || tagLower.includes('expo')) {
      image = 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop'; // Student event outdoor booth
    } else if (catLower.includes('research')) {
      image = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop'; // Biotech researchers
    } else if (catLower.includes('tech') || tagLower.includes('technology')) {
      image = 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800&auto=format&fit=crop'; // Tech laboratory / robotics
    } else if (catLower.includes('community') || tagLower.includes('service') || catLower.includes('charity')) {
      image = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop'; // Local community clinic outreach
    } else {
      image = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop';
    }
  }

  const buttonText = 'Support Project';

  const formatRaised = (val) => {
    return `Rs. ${val.toLocaleString()}`;
  };

  const formatGoal = (val) => {
    if (val >= 1000000) {
      return `Rs. ${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (val >= 1000) {
      return `Rs. ${(val / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `Rs. ${val}`;
  };

  return (
    <div className={`group flex flex-col bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.06)] border border-slate-100 rounded-3xl overflow-hidden transition-all ${!isSuspended ? 'hover:-translate-y-1.5' : 'opacity-75 grayscale-[0.2]'} duration-300`}>

      {/* Clickable Area for Image and Details */}
      <Link
        to={isSuspended ? "#" : `/projects/${id}`}
        onClick={(e) => isSuspended && e.preventDefault()}
        className={`flex flex-col flex-grow ${isSuspended ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Image Banner with Badge */}
        <div className="relative bg-slate-50 h-48 overflow-hidden">
          {/* Floating Verified Badge matching image design with Glassmorphism */}
          {isSuspended ? (
            <div className="top-4 left-4 z-10 absolute flex items-center gap-1.5 bg-rose-100/90 shadow-sm backdrop-blur-md px-3.5 py-1.5 border border-white/20 rounded-full font-bold text-[10px] text-rose-600 select-none">
              Suspended
            </div>
          ) : (
            <div className="top-4 left-4 z-10 absolute flex items-center gap-1.5 bg-white/80 shadow-sm backdrop-blur-md px-3.5 py-1.5 border border-white/20 rounded-full font-bold text-[#2563eb] text-[10px] select-none">
              <svg className="fill-current w-3.5 h-3.5 text-[#2563eb]" viewBox="0 0 512 512">
                <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM382.6 198.6l-144 144c-6.2 6.2-16.4 6.2-22.6 0l-72-72c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L226.7 308l133.3-133.3c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
              </svg>
              Verified Organizer
            </div>
          )}

          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop';
            }}
          />
        </div>

        {/* Card Details */}
        <div className="flex flex-col flex-grow justify-between p-6 pb-0">
          <div>
            {/* Category Label */}
            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-[5px] mb-3 ${tagColor}`}>
              {tag}
            </span>

            {/* Campaign Title */}
            <h3 className="mb-2 font-extrabold text-slate-800 group-hover:text-blue-600 text-base line-clamp-2 leading-snug tracking-tight transition-colors duration-200">
              {title}
            </h3>

            {/* Campaign Description */}
            <p className="mb-6 text-slate-500 text-xs line-clamp-3 leading-relaxed">
              {description}
            </p>
          </div>

          <div>
            {/* Progress Segment */}
            <div className="flex justify-between items-center mb-2 font-bold text-xs">
              <span className="font-bold text-emerald-600">{formatRaised(raised)} raised</span>
              <span className="font-medium text-slate-500">{percentage}% of {formatGoal(goal)}</span>
            </div>

            {/* Bar wrapper with premium Emerald gradient */}
            <div className="bg-slate-100 mb-4 rounded-full w-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-full transition-all duration-700 ease-out"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Action Button Container */}
      <div className="p-6 pt-4">
        <Link
          to={isSuspended ? "#" : `/projects/${id}`}
          onClick={(e) => isSuspended && e.preventDefault()}
          className={`block py-3.5 rounded-xl w-full font-extrabold text-xs text-center transition-all duration-200 ${isSuspended
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : (isGoalReached
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0'
                : isEndDatePassed || camp.status === 'COMPLETED'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 active:scale-[0.98]'
                : 'bg-[#004bd6] hover:bg-[#0037a5] text-white hover:shadow-blue-500/10 hover:shadow-lg active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0')
            }`}
        >
          {isSuspended
            ? 'Project Suspended'
            : isGoalReached
            ? '🎉 Goal Reached — View Campaign'
            : isEndDatePassed || camp.status === 'COMPLETED'
            ? '⏳ Campaign Ended — View Campaign'
            : buttonText}
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
