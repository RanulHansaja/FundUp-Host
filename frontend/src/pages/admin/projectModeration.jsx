import React, { useState, useEffect } from 'react';
import Sidebar from './component/sidebar';
import { getProjectReports, moderateProject, getProjectDetailsWithReports, updateReportStatus, suspendOrganizer, getModerationOrganizerDetails } from '../../services/authService';
import {
  Search, Bell, Settings, ChevronDown, Filter, MoreVertical, AlertTriangle,
  Flag, CheckCircle, X, Ban, MessageSquare, Clock, Trash2,
  Calendar, Eye, FileText, AlertCircle, ChevronUp, Mail, Phone, User, GraduationCap, Building2, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export default function ProjectModeration() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalReported: 0, pendingReviews: 0, resolvedReports: 0, removedProjects: 0
  });
  
  // Selection State
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Detailed Modal State
  const [activeTab, setActiveTab] = useState('project'); // 'project' | 'reports'
  const [detailedProject, setDetailedProject] = useState(null);
  const [detailedReports, setDetailedReports] = useState([]);
  const [expandedReport, setExpandedReport] = useState(null);
  const [reportNotes, setReportNotes] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [projectToReject, setProjectToReject] = useState(null);
  const [rejectProjectSuccess, setRejectProjectSuccess] = useState(false);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const [isSuspendProjectModalOpen, setIsSuspendProjectModalOpen] = useState(false);
  const [suspendProjectReason, setSuspendProjectReason] = useState('');
  const [projectToSuspend, setProjectToSuspend] = useState(null);
  const [suspendProjectSuccess, setSuspendProjectSuccess] = useState(false);

  const [isRejecting, setIsRejecting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);

  const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);
  const [organizerDetails, setOrganizerDetails] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  // Filter State
  const [categories, setCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    try {
        setLoading(true);
        const res = await getProjectReports();
        if (res.data.success) {
            setStats(res.data.data.stats);
            setProjects(res.data.data.projects);
            setCategories(res.data.data.categories || []);
        }
    } catch (err) {
        console.error("Error fetching reports:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setActiveTab('project');
    setModalLoading(true);
    
    try {
        const res = await getProjectDetailsWithReports(project.id);
        if (res.data.success) {
            setDetailedProject(res.data.data.project);
            setDetailedReports(res.data.data.reports);
            
            const initialNotes = {};
            res.data.data.reports.forEach(r => {
                initialNotes[r.reportID] = r.adminNotes || '';
            });
            setReportNotes(initialNotes);
        } else {
            console.error(res.data.message);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setModalLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportID, status) => {
      try {
          const notes = reportNotes[reportID] || '';
          const res = await updateReportStatus(reportID, status, notes);
          if (res.data.success) {
              handleSelectProject(selectedProject);
              fetchReports();
          } else {
              alert(res.data.message);
          }
      } catch(e) {
          console.error(e);
          alert("Error updating report");
      }
  };

  // Reject Project Functions
  const handleOpenRejectModal = (project, e) => {
    if(e) e.stopPropagation();
    setProjectToReject(project);
    setRejectReason('');
    setRejectProjectSuccess(false);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    setIsRejecting(true);
    try {
        const res = await moderateProject(projectToReject.id, 'REJECT', rejectReason);
        if(res.data.success) {
            setRejectProjectSuccess(true);
            fetchReports();
        } else {
            alert(res.data.message);
        }
    } catch (err) {
        alert("An error occurred");
    } finally {
        setIsRejecting(false);
    }
  };

  const handleApprove = async (project) => {
    try {
        const res = await moderateProject(project.id, 'ACTIVE', '');
        if(res.data.success) {
            setSelectedProject(null);
            fetchReports();
        } else {
            alert(res.data.message);
        }
    } catch (err) {
        alert("An error occurred");
    }
  };

  const handleOpenSuspendProjectModal = (project, e) => {
    if(e) e.stopPropagation();
    setProjectToSuspend(project);
    setSuspendProjectReason('');
    setSuspendProjectSuccess(false);
    setIsSuspendProjectModalOpen(true);
  };

  const handleConfirmSuspendProject = async () => {
    setIsSuspending(true);
    try {
        const res = await moderateProject(projectToSuspend.id, 'SUSPEND', suspendProjectReason);
        if(res.data.success) {
            setSuspendProjectSuccess(true);
            fetchReports();
        } else {
            alert(res.data.message);
        }
    } catch (err) {
        alert("An error occurred");
    } finally {
        setIsSuspending(false);
    }
  };

  // Suspend Organizer Functions
  const handleOpenSuspendModal = () => {
      navigate('/admin/user-management', { 
          state: { 
              roleFilter: 'ORGANIZER',
              highlightUserId: detailedProject.organizerUserID 
          } 
      });
  };

  const handleConfirmSuspend = async () => {
      try {
          const res = await suspendOrganizer(detailedProject.organizerUserID, suspendReason);
          if (res.data.success) {
              setIsSuspendModalOpen(false);
              setSelectedProject(null);
              fetchReports();
              alert("Organizer and their projects have been successfully suspended.");
          } else {
              alert(res.data.message);
          }
      } catch (err) {
          console.error(err);
          alert("Error suspending organizer");
      }
  };

  // Contact Organizer Functions
  const handleOpenContactPanel = async () => {
      setIsContactPanelOpen(true);
      setContactLoading(true);
      try {
          const res = await getModerationOrganizerDetails(detailedProject.organizerUserID);
          if (res.data.success) {
              setOrganizerDetails(res.data.data);
          } else {
              alert(res.data.message);
              setIsContactPanelOpen(false);
          }
      } catch (err) {
          console.error(err);
          alert("Error fetching organizer details");
          setIsContactPanelOpen(false);
      } finally {
          setContactLoading(false);
      }
  };

  // Helper for Status Badge Colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Review': return 'bg-amber-100 text-amber-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      case 'Reviewed': return 'bg-indigo-100 text-indigo-700';
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Suspended': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending Review': return { icon: <Clock size={24} strokeWidth={2.5}/>, bg: 'bg-amber-100 text-amber-500' };
      case 'Under Review': return { icon: <Search size={24} strokeWidth={2.5}/>, bg: 'bg-blue-100 text-blue-500' };
      case 'Reviewed': return { icon: <Eye size={24} strokeWidth={2.5}/>, bg: 'bg-indigo-100 text-indigo-500' };
      case 'Approved': return { icon: <CheckCircle size={24} strokeWidth={2.5}/>, bg: 'bg-emerald-100 text-emerald-500' };
      case 'Rejected': return { icon: <X size={24} strokeWidth={2.5}/>, bg: 'bg-red-100 text-red-500' };
      case 'Suspended': return { icon: <Ban size={24} strokeWidth={2.5}/>, bg: 'bg-rose-100 text-rose-500' };
      default: return { icon: <AlertTriangle size={24} strokeWidth={2.5}/>, bg: 'bg-slate-100 text-slate-500' };
    }
  };

  const getReportBadge = (status) => {
      switch (status) {
          case 'PENDING': return 'bg-amber-100 text-amber-700';
          case 'VALID': return 'bg-red-100 text-red-700';
          case 'INVALID': return 'bg-slate-200 text-slate-700';
          case 'RESOLVED': return 'bg-emerald-100 text-emerald-700';
          case 'DISMISSED': return 'bg-slate-100 text-slate-500';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  const filteredProjects = projects.filter(project => {
      const statusMatch = selectedStatus === 'All Statuses' || project.status === selectedStatus;
      const categoryMatch = selectedCategory === 'All Categories' || project.category === selectedCategory;
      const searchMatch = !searchQuery.trim() || project.name.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && categoryMatch && searchMatch;
  });

  const dynamicStats = {
      totalReported: projects.length,
      pendingReviews: projects.filter(p => p.status === 'Pending Review').length,
      resolvedReports: stats.resolvedReports,
      rejectedProjects: projects.filter(p => p.status === 'Rejected').length,
      suspendedProjects: projects.filter(p => p.status === 'Suspended').length
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab="project-moderations" />

      {/* Main Container */}
      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        
        {/* Content Area */}
        <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
          
          {/* Title Section */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
              Reported Projects
            </h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Review reported projects, investigate violations, and manage project integrity.
            </p>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Total Reported<br/>Projects</p>
                      <div className="p-2 bg-red-50 text-red-500 rounded-lg"><AlertTriangle size={20} strokeWidth={2.5}/></div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900">{dynamicStats.totalReported}</h3>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Pending<br/>Reviews</p>
                      <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Clock size={20} strokeWidth={2.5}/></div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900">{dynamicStats.pendingReviews}</h3>
              </div>

              {/* Card 3 (Rejected) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Rejected<br/>Projects</p>
                      <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Ban size={20} strokeWidth={2.5}/></div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900">{dynamicStats.rejectedProjects}</h3>
              </div>

              {/* Card 4 (Suspended) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Suspended<br/>Projects</p>
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Ban size={20} strokeWidth={2.5}/></div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900">{dynamicStats.suspendedProjects}</h3>
              </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center justify-between shadow-sm mb-6 gap-4">
              {/* Search and Quick Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap md:flex-nowrap">
                  <div className="relative w-full md:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search project by name..." 
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition font-medium text-slate-700" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                  {(() => {
                      const totalNewReports = projects.reduce((sum, p) => sum + (p.newReportsCount || 0), 0);
                      return (
                          <button 
                              onClick={() => {
                                  if (totalNewReports > 0) {
                                      setSelectedStatus('Pending Review');
                                  } else {
                                      alert("No New Reports");
                                  }
                              }}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl border transition shadow-sm whitespace-nowrap group w-full md:w-auto ${totalNewReports > 0 ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                          >
                              <div className="relative">
                                  <Bell size={16} className={totalNewReports > 0 ? "text-rose-500" : "text-slate-400"} />
                                  {totalNewReports > 0 && (
                                      <>
                                          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
                                      </>
                                  )}
                              </div>
                              New Reports {totalNewReports > 0 && `(${totalNewReports})`}
                          </button>
                      );
                  })()}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Status:</span>
                      <div className="relative flex items-center">
                          <select 
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              className="appearance-none bg-transparent cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-600 transition focus:outline-none pr-5 z-10 relative"
                          >
                              <option value="All Statuses">All Statuses</option>
                              <option value="Pending Review">Pending Review</option>
                              <option value="Reviewed">Reviewed</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Suspended">Suspended</option>
                          </select>
                          <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 z-0 pointer-events-none"/>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Category:</span>
                      <div className="relative flex items-center">
                          <select 
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="appearance-none bg-transparent cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-600 transition focus:outline-none pr-5 z-10 relative max-w-[150px] truncate"
                          >
                              <option value="All Categories">All Categories</option>
                              <option value="Education">Education</option>
                              <option value="Sports">Sports</option>
                              <option value="Charity">Charity</option>
                              <option value="Health & Medical">Health & Medical</option>
                              <option value="Environment">Environment</option>
                              <option value="Other">Other</option>
                          </select>
                          <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 z-0 pointer-events-none"/>
                      </div>
                  </div>
              </div>
          </div>

          {/* Project List - ALWAYS VISIBLE */}
          <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-500 px-1">
                  <span>Showing {filteredProjects.length} projects</span>
              </div>
              {filteredProjects.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-semibold shadow-sm">No projects found for the selected status.</div>
                  ) : (
                      filteredProjects.map((project) => {
                          const isFlagged = project.reportsCount > 0 && project.status !== 'Approved' && project.status !== 'Removed';
                          
                          return (
                              <div 
                                  key={project.id}
                                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-6 transition hover:shadow-md relative overflow-hidden"
                              >
                                  {/* Left Section: Info */}
                                  <div className="flex items-start gap-4 flex-1">
                                      <div className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center ${getStatusIcon(project.status).bg}`}>
                                          {getStatusIcon(project.status).icon}
                                      </div>
                                      <div>
                                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight mb-1">{project.name}</h3>
                                          <p className="text-[11px] font-bold text-slate-500 mb-3 flex gap-2">
                                              <span>{project.organizer}</span>
                                              <span className="text-slate-300">•</span>
                                              <span>{project.category}</span>
                                          </p>
                                          <div className="flex items-center gap-3">
                                              <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${getStatusBadge(project.status)}`}>
                                                  {project.status.toUpperCase()}
                                              </span>
                                              <span className="text-[11px] font-semibold text-slate-400">
                                                  Submitted {project.submittedDate}
                                              </span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Middle Section: Reason */}
                                  <div className="flex-1 md:border-l md:border-slate-100 md:pl-6 py-2">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Reason</p>
                                      <p className="font-bold text-slate-800 text-sm leading-tight">{project.reportReason || "Suspicious Activity"}</p>
                                  </div>

                                  {/* Right Section: Actions */}
                                  <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
                                      <div className="flex gap-2 mr-2">
                                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${project.newReportsCount > 0 ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 animate-pulse border border-rose-500' : 'bg-rose-50 text-rose-600 border border-transparent'}`}>
                                              {project.newReportsCount || 0} New Reports
                                          </div>
                                          <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                                              {project.reportsCount || 0} Total Reports
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => handleSelectProject(project)}
                                          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition shadow-sm"
                                      >
                                          <Eye size={14} /> Review
                                      </button>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>

          {/* Project Review Details Modal */}
          {selectedProject && (
              <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
                  {/* Backdrop */}
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProject(null)}></div>
                  
                  {/* Modal Content */}
                  <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                      
                      {/* Modal Header */}
                      <div className="p-6 md:p-8 border-b border-slate-100 flex items-start justify-between bg-white shrink-0 rounded-t-3xl pb-0">
                          <div className="flex flex-col gap-2 w-full">
                              <div className="flex justify-between items-start">
                                  <h2 className="font-extrabold text-slate-900 text-2xl tracking-tight">Project Review Details</h2>
                                  <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition border border-slate-200 shadow-sm">
                                      <X size={18} />
                                  </button>
                              </div>
                              <div className="flex">
                                  <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md ${getStatusBadge(selectedProject.status)}`}>
                                      {selectedProject.status.toUpperCase()}
                                  </span>
                              </div>

                              {/* Tabs */}
                              <div className="flex mt-6 gap-6 border-b border-slate-200">
                                  <button 
                                      className={`pb-4 text-sm font-bold border-b-2 transition ${activeTab === 'project' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                      onClick={() => setActiveTab('project')}
                                  >
                                      Project Review
                                  </button>
                                  <button 
                                      className={`pb-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                      onClick={() => setActiveTab('reports')}
                                  >
                                      Reports Review
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Modal Scrollable Body */}
                      <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/50 flex-1 relative">
                          
                          {modalLoading ? (
                              <div className="flex items-center justify-center h-48">
                                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                              </div>
                          ) : (
                              <>
                                  {activeTab === 'project' && detailedProject && (
                                      <div className="space-y-10">
                                          {/* Section: Project Information */}
                                          <div>
                                              <div className="flex items-center gap-2 text-slate-400 mb-6">
                                                  <FileText size={16} />
                                                  <h4 className="text-[11px] font-black uppercase tracking-widest">Project Information</h4>
                                              </div>
                                              
                                              <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                  <div>
                                                      <p className="text-[11px] font-bold text-slate-400 mb-1">Project Name & Category</p>
                                                      <div className="flex flex-wrap items-center gap-3">
                                                          <p className="font-extrabold text-slate-900 text-xl">{detailedProject.name}</p>
                                                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{detailedProject.category}</span>
                                                      </div>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                      <div>
                                                          <p className="text-[11px] font-bold text-slate-400 mb-1">Organizer</p>
                                                          <div className="flex items-center gap-2">
                                                              <p className="font-bold text-slate-800 text-sm">{detailedProject.organizer}</p>
                                                              {detailedProject.organizerVerificationStatus && (
                                                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md ${
                                                                      detailedProject.organizerVerificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                                                      detailedProject.organizerVerificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                      'bg-amber-100 text-amber-700'
                                                                  }`}>
                                                                      {detailedProject.organizerVerificationStatus}
                                                                  </span>
                                                              )}
                                                          </div>
                                                      </div>
                                                      <div>
                                                          <p className="text-[11px] font-bold text-slate-400 mb-1">University / Organization</p>
                                                          <p className="font-bold text-slate-800 text-sm">{detailedProject.universityName || 'N/A'}</p>
                                                      </div>
                                                  </div>

                                                  <div>
                                                      <p className="text-[11px] font-bold text-slate-400 mb-2">Description</p>
                                                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                          {detailedProject.description}
                                                      </div>
                                                  </div>

                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                                                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Raised / Goal</p>
                                                          <div className="flex items-baseline gap-2">
                                                              <p className="text-2xl font-black text-emerald-700">{detailedProject.raisedFormatted}</p>
                                                              <p className="text-sm font-bold text-emerald-600/50">/ {detailedProject.targetFormatted}</p>
                                                          </div>
                                                          {/* Progress Bar */}
                                                          <div className="mt-3 bg-emerald-100 rounded-full h-1.5 w-full overflow-hidden mb-2">
                                                              <div className="bg-emerald-500 h-full rounded-full" style={{width: `${detailedProject.progress}%`}}></div>
                                                          </div>
                                                          <p className="text-xs font-bold text-emerald-700">{detailedProject.donorCount} Donors Supported</p>
                                                      </div>
                                                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col justify-center gap-3">
                                                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Project Timeline</p>
                                                          <div className="flex flex-col gap-1">
                                                              <div className="flex justify-between">
                                                                  <span className="text-xs font-bold text-slate-500">Created Date:</span>
                                                                  <span className="text-xs font-bold text-slate-800">{detailedProject.createdDate}</span>
                                                              </div>
                                                              <div className="flex justify-between">
                                                                  <span className="text-xs font-bold text-slate-500">Start Date:</span>
                                                                  <span className="text-xs font-bold text-slate-800">{detailedProject.startDate || 'N/A'}</span>
                                                              </div>
                                                              <div className="flex justify-between">
                                                                  <span className="text-xs font-bold text-slate-500">End Date:</span>
                                                                  <span className="text-xs font-bold text-slate-800">{detailedProject.endDate || 'N/A'}</span>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Section: Verification Documents */}
                                          <div>
                                              <div className="flex items-center gap-2 text-slate-400 mb-6">
                                                  <FileText size={16} />
                                                  <h4 className="text-[11px] font-black uppercase tracking-widest">Verification Documents</h4>
                                              </div>
                                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                  {(!detailedProject.organizerVerifications || detailedProject.organizerVerifications.length === 0) && !detailedProject.proposalPdfPath ? (
                                                      <div className="text-center py-8">
                                                          <p className="text-sm font-medium text-slate-500">No verification documents have been uploaded.</p>
                                                      </div>
                                                  ) : (
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                                          {detailedProject.organizerVerifications?.map((verification, idx) => (
                                                              <React.Fragment key={idx}>
                                                                  {/* Student ID */}
                                                                  {verification.studentIdPath && (
                                                                      <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                                                          <div className="bg-slate-50 h-32 flex items-center justify-center p-4 relative border-b border-slate-200 group overflow-hidden">
                                                                              {verification.studentIdPath.toLowerCase().endsWith('.pdf') ? (
                                                                                  <FileText size={48} className="text-blue-500" />
                                                                              ) : (
                                                                                  <img src={`${BACKEND_URL}/${verification.studentIdPath}`} alt="Student ID" className="w-full h-full object-cover" />
                                                                              )}
                                                                          </div>
                                                                          <div className="p-4 flex flex-col items-center justify-center bg-white flex-1">
                                                                              <p className="text-xs font-bold text-slate-800 mb-1">Student ID</p>
                                                                              <p className="text-[9px] font-bold text-slate-400 mb-3">{verification.submittedDate}</p>
                                                                              <a 
                                                                                  href={`${BACKEND_URL}/${verification.studentIdPath}`} 
                                                                                  target="_blank" 
                                                                                  rel="noopener noreferrer"
                                                                                  className="px-4 py-2 w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg transition"
                                                                              >
                                                                                  View Full Document
                                                                              </a>
                                                                          </div>
                                                                      </div>
                                                                  )}

                                                                  {/* Club Approval Letter */}
                                                                  {verification.approvalLetterPath && (
                                                                      <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                                                          <div className="bg-slate-50 h-32 flex items-center justify-center p-4 relative border-b border-slate-200 group overflow-hidden">
                                                                              {verification.approvalLetterPath.toLowerCase().endsWith('.pdf') ? (
                                                                                  <FileText size={48} className="text-emerald-500" />
                                                                              ) : (
                                                                                  <img src={`${BACKEND_URL}/${verification.approvalLetterPath}`} alt="Approval Letter" className="w-full h-full object-cover" />
                                                                              )}
                                                                          </div>
                                                                          <div className="p-4 flex flex-col items-center justify-center bg-white flex-1">
                                                                              <p className="text-xs font-bold text-slate-800 mb-1">Club Approval Letter</p>
                                                                              <p className="text-[9px] font-bold text-slate-400 mb-3">{verification.submittedDate}</p>
                                                                              <a 
                                                                                  href={`${BACKEND_URL}/${verification.approvalLetterPath}`} 
                                                                                  target="_blank" 
                                                                                  rel="noopener noreferrer"
                                                                                  className="px-4 py-2 w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg transition"
                                                                              >
                                                                                  View Full Document
                                                                              </a>
                                                                          </div>
                                                                      </div>
                                                                  )}
                                                              </React.Fragment>
                                                          ))}

                                                          {/* Project Proposal */}
                                                          {detailedProject.proposalPdfPath && (
                                                              <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                                                  <div className="bg-slate-50 h-32 flex items-center justify-center p-4 relative border-b border-slate-200">
                                                                      {detailedProject.proposalPdfPath.toLowerCase().endsWith('.pdf') ? (
                                                                          <FileText size={48} className="text-amber-500" />
                                                                      ) : (
                                                                          <img src={`${BACKEND_URL}/${detailedProject.proposalPdfPath}`} alt="Project Proposal" className="w-full h-full object-cover" />
                                                                      )}
                                                                  </div>
                                                                  <div className="p-4 flex flex-col items-center justify-center bg-white flex-1">
                                                                      <p className="text-xs font-bold text-slate-800 mb-1">Project Proposal</p>
                                                                      <p className="text-[9px] font-bold text-slate-400 mb-3">Project Specific</p>
                                                                      <a 
                                                                          href={`${BACKEND_URL}/${detailedProject.proposalPdfPath}`} 
                                                                          target="_blank" 
                                                                          rel="noopener noreferrer"
                                                                          className="px-4 py-2 w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg transition"
                                                                      >
                                                                          View Full Document
                                                                      </a>
                                                                  </div>
                                                              </div>
                                                          )}
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                          
                                          {/* Section: Additional Images */}
                                          {detailedProject.media && detailedProject.media.length > 0 && (
                                              <div>
                                                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                                                      <Eye size={16} />
                                                      <h4 className="text-[11px] font-black uppercase tracking-widest">Additional Media</h4>
                                                  </div>
                                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                      {detailedProject.media.map((media, idx) => (
                                                          <div key={idx} className="bg-slate-100 rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm relative group">
                                                              {media.mediaType === 'IMAGE' ? (
                                                                  <a href={`${BACKEND_URL}/${media.mediaPath}`} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                                                                      <img src={`${BACKEND_URL}/${media.mediaPath}`} alt="Project Media" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                          <span className="text-white text-xs font-bold">View Full</span>
                                                                      </div>
                                                                  </a>
                                                              ) : (
                                                                  <video src={`${BACKEND_URL}/${media.mediaPath}`} controls className="w-full h-full object-cover" />
                                                              )}
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}

                                          {/* Section: Progress Updates */}
                                          {detailedProject.updates && detailedProject.updates.length > 0 && (
                                              <div>
                                                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                                                      <Calendar size={16} />
                                                      <h4 className="text-[11px] font-black uppercase tracking-widest">Progress Updates</h4>
                                                  </div>
                                                  <div className="space-y-4">
                                                      {detailedProject.updates.map((update, idx) => (
                                                          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                              <div className="flex justify-between items-start mb-3">
                                                                  <h5 className="font-extrabold text-slate-900 text-sm">{update.title}</h5>
                                                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{update.updateDate}</span>
                                                              </div>
                                                              <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">{update.description}</p>
                                                              {((update.imagePaths && update.imagePaths.length > 0) || (update.videoPaths && update.videoPaths.length > 0)) ? (
                                                                  <div className="space-y-3 mt-3">
                                                                      {update.imagePaths && update.imagePaths.length > 0 && (
                                                                          <div className="flex flex-wrap gap-2">
                                                                              {update.imagePaths.map((path, pIdx) => {
                                                                                  const imgUrl = `${BACKEND_URL}/${path.startsWith('/') ? path.substring(1) : path}`;
                                                                                  return (
                                                                                      <a key={pIdx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block w-32 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group">
                                                                                          <img src={imgUrl} alt="Update Photo" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                              <span className="text-white text-[10px] font-bold">View Full</span>
                                                                                          </div>
                                                                                      </a>
                                                                                  );
                                                                              })}
                                                                          </div>
                                                                      )}
                                                                      {update.videoPaths && update.videoPaths.length > 0 && (
                                                                          <div className="flex flex-wrap gap-2">
                                                                              {update.videoPaths.map((path, vIdx) => {
                                                                                  const vidUrl = `${BACKEND_URL}/${path.startsWith('/') ? path.substring(1) : path}`;
                                                                                  return (
                                                                                      <div key={vIdx} className="block w-48 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
                                                                                          <video src={vidUrl} controls className="w-full h-full object-cover" />
                                                                                      </div>
                                                                                  );
                                                                              })}
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                              ) : (
                                                                  update.imagePath && (
                                                                      <a href={`${BACKEND_URL}/${update.imagePath}`} target="_blank" rel="noopener noreferrer" className="block w-32 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group">
                                                                          <img src={`${BACKEND_URL}/${update.imagePath}`} alt="Update" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                              <span className="text-white text-[10px] font-bold">View Full</span>
                                                                          </div>
                                                                      </a>
                                                                  )
                                                              )}
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  )}

                                  {activeTab === 'reports' && detailedReports && (
                                      <div className="space-y-6">
                                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                                              <AlertCircle size={16} />
                                              <h4 className="text-[11px] font-black uppercase tracking-widest">Submitted Reports</h4>
                                          </div>
                                          
                                          {detailedReports.length === 0 ? (
                                              <p className="text-sm text-slate-500 text-center py-10">No reports found.</p>
                                          ) : (
                                              <div className="space-y-4">
                                                  {detailedReports.map(report => {
                                                      const isNew = report.status === 'PENDING';
                                                      return (
                                                      <div key={report.reportID} className={`border rounded-xl overflow-hidden transition-all shadow-sm ${expandedReport === report.reportID ? 'border-blue-200 ring-2 ring-blue-50' : isNew ? 'border-amber-300 ring-1 ring-amber-100 bg-amber-50/30' : 'border-slate-200'}`}>
                                                          {/* Header */}
                                                          <div 
                                                              className={`p-4 flex items-center justify-between cursor-pointer transition ${expandedReport === report.reportID ? 'bg-blue-50/30' : isNew ? 'hover:bg-amber-100/50' : 'bg-white hover:bg-slate-50'}`}
                                                              onClick={() => setExpandedReport(expandedReport === report.reportID ? null : report.reportID)}
                                                          >
                                                              <div className="flex flex-col gap-1">
                                                                  <div className="flex items-center gap-2">
                                                                      <span className="font-bold text-slate-900 text-sm">{report.reason}</span>
                                                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${getReportBadge(report.status)}`}>{report.status}</span>
                                                                  </div>
                                                                  <span className="text-xs text-slate-500 font-medium">{report.date} • By {report.reporterName}</span>
                                                              </div>
                                                              <div className="flex items-center text-slate-400">
                                                                  {expandedReport === report.reportID ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                              </div>
                                                          </div>
                                                          
                                                          {/* Expanded Content */}
                                                          {expandedReport === report.reportID && (
                                                              <div className="p-5 bg-white border-t border-slate-100 space-y-5 animate-in slide-in-from-top-2 duration-200">
                                                                  <div>
                                                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">User Description</p>
                                                                      <div className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                                                                          {report.description || <span className="italic text-slate-400">No additional description provided.</span>}
                                                                      </div>
                                                                  </div>
                                                                  
                                                                  <div>
                                                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Internal Admin Notes</p>
                                                                      <textarea 
                                                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y font-medium text-slate-700"
                                                                          rows="3"
                                                                          placeholder="Add internal notes regarding this report..."
                                                                          value={reportNotes[report.reportID] || ''}
                                                                          onChange={(e) => setReportNotes({...reportNotes, [report.reportID]: e.target.value})}
                                                                      ></textarea>
                                                                  </div>
                                                                  
                                                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 mt-2">
                                                                      <button onClick={() => handleUpdateReportStatus(report.reportID, 'VALID')} className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-xl transition shadow-sm">Mark Valid</button>
                                                                      <button onClick={() => handleUpdateReportStatus(report.reportID, 'INVALID')} className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 font-bold text-xs rounded-xl transition shadow-sm">Mark Invalid</button>
                                                                  </div>
                                                              </div>
                                                          )}
                                                      </div>
                                                      );
                                                  })}
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </>
                          )}
                      </div>

                      {/* Actions Footer (Applies to the Project) */}
                      {activeTab === 'project' && (
                          <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex flex-col gap-3 shrink-0">
                              {selectedProject.status !== 'Rejected' ? (
                                  <div className="flex gap-3">
                                      {selectedProject.status === 'Suspended' ? (
                                          <button 
                                              onClick={() => handleApprove(selectedProject)}
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-xl flex justify-center items-center gap-2 transition shadow-sm"
                                          >
                                              <CheckCircle size={16} /> Activate Project
                                          </button>
                                      ) : (
                                          <button 
                                              onClick={(e) => handleOpenSuspendProjectModal(selectedProject, e)}
                                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3.5 rounded-xl flex justify-center items-center gap-2 transition shadow-sm"
                                          >
                                              <Ban size={16} /> Suspend Project
                                          </button>
                                      )}
                                      <button 
                                          onClick={(e) => handleOpenRejectModal(selectedProject, e)}
                                          className="flex-1 bg-[#E11D48] hover:bg-rose-700 text-white font-bold text-sm py-3.5 rounded-xl flex justify-center items-center gap-2 transition shadow-sm"
                                      >
                                          <Trash2 size={16} /> Reject Project
                                      </button>
                                  </div>
                              ) : (
                                  <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-center text-sm font-bold border border-rose-100 flex items-center justify-center gap-2">
                                      <Trash2 size={16} /> This project has been permanently rejected.
                                  </div>
                              )}
                              <div className="flex gap-3">
                                  <button onClick={handleOpenSuspendModal} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold text-sm py-3 rounded-xl hover:bg-slate-50 transition shadow-sm flex justify-center items-center gap-2">
                                      <Ban size={14} /> Suspend Org
                                  </button>
                                  <button onClick={handleOpenContactPanel} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold text-sm py-3 rounded-xl hover:bg-slate-50 transition shadow-sm flex justify-center items-center gap-2">
                                      <MessageSquare size={14} /> Contact Org
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

        </div>
      </main>

      {/* Reject Confirmation Modal */}
      {isRejectModalOpen && projectToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
            {rejectProjectSuccess ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Rejected
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                  The project <span className="font-bold text-slate-900">{projectToReject.name}</span> has been successfully rejected.
                </p>
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setProjectToReject(null);
                    setSelectedProject(null);
                  }}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  Back
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
                  <Trash2 size={28} />
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Reject Project?
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                  You are about to reject <span className="font-bold text-slate-900">{projectToReject.name}</span>. This action will block donations and mark the project as inactive.
                </p>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Rejection Reason (Required)</label>
                  <textarea 
                    rows={4}
                    placeholder="Enter the official reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-none font-medium text-slate-700"
                  ></textarea>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    disabled={isRejecting}
                    className="flex-1 py-3.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    disabled={!rejectReason.trim() || isRejecting}
                    className={`flex-1 py-3.5 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                      rejectReason.trim() && !isRejecting
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-rose-400 cursor-not-allowed'
                    }`}
                  >
                    {isRejecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Rejecting...
                      </>
                    ) : (
                      "Confirm Rejection"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Suspend Organizer Modal */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
              <Ban size={28} />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Suspend Organizer?
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              You are about to suspend <span className="font-bold text-slate-900">{detailedProject?.organizer}</span>. This will suspend their account and ALL their active projects.
            </p>

            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Suspension Reason (Required)</label>
              <textarea 
                rows={4}
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none font-medium text-slate-700"
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="flex-1 py-3.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={!suspendReason.trim()}
                className={`flex-1 py-3.5 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer ${
                  suspendReason.trim() 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-amber-400 cursor-not-allowed'
                }`}
              >
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Organizer Side Panel */}
      {isContactPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsContactPanelOpen(false)}></div>
              
              <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right-full duration-300 border-l border-slate-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">Organizer Profile</h2>
                      <button onClick={() => setIsContactPanelOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition">
                          <X size={18} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                      {contactLoading ? (
                          <div className="flex items-center justify-center h-48">
                              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          </div>
                      ) : organizerDetails ? (
                          <div className="space-y-8">
                              {/* Profile Header */}
                              <div className="flex flex-col items-center text-center">
                                  <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md mb-4 overflow-hidden">
                                      {organizerDetails.profilePhoto ? (
                                          <img src={organizerDetails.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                                              <User size={40} />
                                          </div>
                                      )}
                                  </div>
                                  <h3 className="font-extrabold text-slate-900 text-xl">{organizerDetails.fullName}</h3>
                                  <span className={`mt-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${organizerDetails.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {organizerDetails.accountStatus} ACCOUNT
                                  </span>
                              </div>
                              
                              {/* Details Grid */}
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                  <div className="flex items-center gap-3">
                                      <Mail size={16} className="text-slate-400" />
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                          <p className="font-bold text-slate-800 text-sm">{organizerDetails.email}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <Phone size={16} className="text-slate-400" />
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                                          <p className="font-bold text-slate-800 text-sm">{organizerDetails.phoneNo || 'Not provided'}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <GraduationCap size={16} className="text-slate-400" />
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University</p>
                                          <p className="font-bold text-slate-800 text-sm">{organizerDetails.universityName || 'Not affiliated'}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <Building2 size={16} className="text-slate-400" />
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department / Organization</p>
                                          <p className="font-bold text-slate-800 text-sm">{organizerDetails.department}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <Calendar size={16} className="text-slate-400" />
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Date</p>
                                          <p className="font-bold text-slate-800 text-sm">{organizerDetails.registrationDate}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-10 text-slate-500">Could not load organizer details.</div>
                      )}
                  </div>
                  

              </div>
          </div>
      )}
      {/* Suspend Project Confirmation Modal */}
      {isSuspendProjectModalOpen && projectToSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
            {suspendProjectSuccess ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Suspended
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                  The project <span className="font-bold text-slate-900">{projectToSuspend.name}</span> has been successfully suspended.
                </p>
                <button
                  onClick={() => {
                    setIsSuspendProjectModalOpen(false);
                    setProjectToSuspend(null);
                    setSelectedProject(null);
                  }}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  Back
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                  <Ban size={28} />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                  Suspend Project?
                </h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">
                  You are about to suspend <span className="font-bold text-slate-900">{projectToSuspend.name}</span>. This action will block donations and viewing of this project.
                </p>
                
                <div className="mb-8">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Reason for Suspension
                  </label>
                  <textarea 
                    className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none font-medium text-slate-700 bg-slate-50 placeholder:text-slate-300"
                    rows="3"
                    placeholder="E.g., Investigation pending due to suspicious activity..."
                    value={suspendProjectReason}
                    onChange={(e) => setSuspendProjectReason(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsSuspendProjectModalOpen(false)}
                    disabled={isSuspending}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmSuspendProject}
                    disabled={!suspendProjectReason.trim() || isSuspending}
                    className={`flex-1 font-bold py-3.5 rounded-xl transition shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                      suspendProjectReason.trim() && !isSuspending
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSuspending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Suspending...
                      </>
                    ) : (
                      "Suspend"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
