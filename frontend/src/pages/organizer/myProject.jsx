import { useState, useEffect, useRef } from 'react';
import Sidebar from './component/sidebar';
import { getOrganizerProjects, deleteProject, updateProject, createProgressUpdate } from '../../services/authService';
import { Edit2, Trash2, BarChart3, Calendar, AlertCircle, X, ExternalLink } from 'lucide-react';

// =========================================================================
// CONSTANTS & UTILITIES
// =========================================================================


// Allowed campaign categories verified by the system
const allowedCategories = [
  'Education',
  'Sports',
  'Charity',
  'Health & Medical',
  'Environment',
  'Other'
];

/* eslint-disable no-unused-vars */
/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns {string} YYYY-MM-DD date string
 */
// ==================== Date Validation Utility Functions ====================
// Retrieves local baseline date in YYYY-MM-DD standard format
const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Validates whether a given string is a valid YYYY-MM-DD date.
 * @param {string} value - The date string to validate
 * @returns {boolean} True if the date is valid, false otherwise
 */
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
};

/**
 * Validates project creation form fields (retained for backward compatibility/imports).
 * @param {object} params
 * @param {object} params.formData - Project fields
 * @param {object} params.coverImage - Cover image file
 * @param {object} params.proposalPdf - Proposal PDF file
 * @returns {string} Error message if invalid, or empty string if valid
 */
// Validates project form parameters during creation (kept for validation parity)
const validateProject = ({ formData, coverImage, proposalPdf }) => {
  if (!formData.title.trim()) return 'Project title is required.';

  // Title cannot consist of only numbers
  if (/^\d+$/.test(formData.title))
    return 'Project title cannot contain only numbers.';

  // Title must contain at least one letter
  if (!/[A-Za-z]/.test(formData.title))
    return 'Project title must contain at least one letter.';

  if (formData.title.trim().length > 150) return 'Project title must be 150 characters or fewer.';
  if (!allowedCategories.includes(formData.category)) return 'Please select a valid project category.';
  if (!formData.description.trim()) return 'Detailed description is required.';
  if (formData.shortSummary.trim().length > 500) return 'Short summary must be 500 characters or fewer.';

  const targetAmount = Number(formData.targetAmount);
  if (!Number.isFinite(targetAmount) || targetAmount <= 0 || targetAmount < 10000) {
    return 'Target amount must be a positive number and at least Rs. 10,000.';
  }

  if (!isValidDate(formData.startDate) || !isValidDate(formData.endDate)) {
    return 'Please enter valid start and end dates.';
  }
  if (formData.startDate < getToday()) return 'Start date cannot be in the past.';
  if (formData.endDate <= formData.startDate) return 'End date must be after the start date.';

  if (formData.socialMediaLink) {
    try {
      const url = new URL(formData.socialMediaLink);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      return 'Please enter a valid social media URL.';
    }
  }

  return '';
};
/* eslint-enable no-unused-vars */

/**
 * MyProject page component for managing active campaigns.
 */
// ==================== Organizer My Campaigns Page Component ====================
const MyProject = ({ user }) => {

  // =========================================================================
  // CURRENT USER STATE & SIDEBAR STATE
  // =========================================================================

  // Mobile menu visibility control state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authenticated user state loaded from context props or localStorage session mapping
  const [userState, setUserState] = useState(() => {
    if (user?.userID) return user;
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user?.userID) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserState(user);
    }
  }, [user]);


  // =========================================================================
  // LOAD PROJECTS FEATURE
  // =========================================================================

  // --- Load Projects State ---
  // State lists and API feedback trackers for campaigns owned by the organizer
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Load Projects API ---
  // Pulls projects created by the logged-in organizer from backend DB tables
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      if (!userState?.userID) {
        setError('Unable to load projects. Please sign in again.');
        return;
      }
      const response = await getOrganizerProjects(userState.userID);
      if (response.data.success) {
        setProjects(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch projects.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while loading projects.');
    } finally {
      setLoading(false);
    }
  };

  // --- Load Projects Effects ---
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState]);


  // =========================================================================
  // EDIT PROJECT FEATURE
  // =========================================================================

  // --- Edit Project State ---
  // States and refs to manage the edit campaign modal overlay
  const [editingProject, setEditingProject] = useState(null);
  const [originalEditingProject, setOriginalEditingProject] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [proposalPdf, setProposalPdf] = useState(null);
  const editProposalInputRef = useRef(null);

  const handleRemoveNewProposal = () => {
    setProposalPdf(null);
    if (editProposalInputRef.current) {
      editProposalInputRef.current.value = '';
    }
    setUpdateError('');
    setUpdateSuccess('');
  };

  // --- Edit Project Validation ---
  // Form checks to validate updated campaign values inside the edit modal
  const validateProjectDetails = ({ project, proposalPdf }) => {
    // 1. Check whether a proposal PDF was selected/exists
    if (!proposalPdf && !project.proposalPdfPath) {
      return 'Please upload a project proposal PDF.';
    }
    // 2. Check that the selected file is a PDF
    if (proposalPdf && proposalPdf.type !== 'application/pdf') {
      return 'Proposal document must be a PDF file.';
    }
    // 3. Check the file size
    if (proposalPdf && proposalPdf.size > 10 * 1024 * 1024) {
      return 'Proposal document must be 10MB or smaller.';
    }

    if (!project?.title?.trim()) {
      return 'Project title is required.';
    }
    if (/^\d+$/.test(project.title.trim())) {
      return 'Project title cannot contain only numbers.';
    }
    if (!/[A-Za-z]/.test(project.title.trim())) {
      return 'Project title must contain at least one alphabetic letter.';
    }
    if (project.title.trim().length > 150) {
      return 'Project title must be 150 characters or fewer.';
    }
    if (!allowedCategories.includes(project.category)) {
      return 'Please select a valid project category.';
    }
    if (!project.description?.trim()) {
      return 'Detailed description is required.';
    }
    if ((project.shortSummary || '').trim().length > 500) {
      return 'Short summary must be 500 characters or fewer.';
    }

    const targetAmount = Number(project.goal ?? project.targetAmount ?? 0);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0 || targetAmount < 10000) {
      return 'Target amount must be a positive number and at least Rs. 10,000.';
    }

    // Context-scoped helper methods for date checks
    const getLocalToday = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const isLocalValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day;
    };

    if (!isLocalValidDate(project.startDate) || !isLocalValidDate(project.endDate)) {
      return 'Please enter valid start and end dates.';
    }
    if (project.startDate < getLocalToday()) {
      return 'Start date cannot be in the past.';
    }
    if (project.endDate <= project.startDate) {
      return 'End date must be after the start date.';
    }

    if (project.socialMediaLink) {
      try {
        const url = new URL(project.socialMediaLink);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        return 'Please enter a valid social media URL.';
      }
    }

    return '';
  };

  // --- Edit Project Functions ---
  const openEditModal = (project) => {
    const editable = {
      ...project,
      // Date inputs require YYYY-MM-DD format
      startDate: project.startDate ? project.startDate.split(' ')[0] : '',
      endDate: project.endDate ? project.endDate.split(' ')[0] : ''
    };
    setEditingProject(editable);
    setOriginalEditingProject(editable);
    setUpdateError('');
    setUpdateSuccess('');
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setOriginalEditingProject(null);
    setProposalPdf(null);
    if (editProposalInputRef.current) {
      editProposalInputRef.current.value = '';
    }
    setUpdateError('');
    setUpdateSuccess('');
  };

  const handleResetEdit = () => {
    if (!originalEditingProject) return;
    setEditingProject(originalEditingProject);
    setProposalPdf(null);
    if (editProposalInputRef.current) {
      editProposalInputRef.current.value = '';
    }
    setUpdateError('');
    setUpdateSuccess('');
  };

  // --- Edit Project API ---
  // Packs modified project inputs/proposal PDF into FormData and submits via update API
  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingProject) return;

    setUpdateError('');
    setUpdateSuccess('');

    const validationMessage = validateProjectDetails({ project: editingProject, proposalPdf });
    if (validationMessage) {
      setUpdateError(validationMessage);
      return;
    }

    setIsUpdating(true);

    try {
      const payload = new FormData();
      payload.append('projectID', editingProject.id);
      payload.append('title', editingProject.title);
      payload.append('category', editingProject.category);
      payload.append('shortSummary', editingProject.shortSummary || '');
      payload.append('description', editingProject.description);
      payload.append('targetAmount', String(editingProject.goal ?? editingProject.targetAmount ?? 0));
      payload.append('startDate', editingProject.startDate);
      payload.append('endDate', editingProject.endDate);
      payload.append('socialMediaLink', editingProject.socialMediaLink || '');

      if (proposalPdf) {
        payload.append('proposalPdf', proposalPdf);
      }

      if (!editingProject.title || !editingProject.category || !editingProject.description || Number(editingProject.goal ?? editingProject.targetAmount ?? 0) <= 0 || !editingProject.startDate || !editingProject.endDate) {
        setUpdateError('Please fill in all required fields before updating the project.');
        return;
      }

      const response = await updateProject(payload);

      if (response?.data?.success) {
        closeEditModal();
        await fetchProjects();
        openResultModal('success', 'Success!', response.data.message || 'Project updated successfully.');
      } else {
        setUpdateError(response?.data?.message || 'Failed to update project.');
        openResultModal('error', 'Update Failed', response?.data?.message || 'Failed to update project.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error updating project.';
      setUpdateError(message);
      openResultModal('error', 'Update Failed', message);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Edit Project UI ---
  const renderEditProjectModal = () => {
    if (!editingProject) return null;
    return (
      <div className="z-50 fixed inset-0 flex justify-center items-center bg-slate-950/30 backdrop-blur-sm p-3 sm:p-4">
        <div
          className="flex flex-col bg-white shadow-2xl border border-slate-100 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden animate-in duration-200 fade-in zoom-in-95"
          style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-start gap-4 p-6 border-slate-100 border-b shrink-0">
            <div>
              <h3 className="font-black text-slate-800 text-xl">Update Project Details</h3>
              <p className="mt-1 font-semibold text-slate-400 text-sm">Modify text contents, summary, target goal, date values, or proposal pdf</p>
            </div>
            <button
              onClick={closeEditModal}
              className="hover:bg-slate-50 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleUpdateSubmit} className="flex-1 space-y-6 p-6 overflow-y-auto">
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Project Title</label>
                <input
                  type="text"
                  required
                  value={editingProject.title}
                  onChange={(e) => {
                    setEditingProject({ ...editingProject, title: e.target.value });
                    setUpdateError('');
                    setUpdateSuccess('');
                  }}
                  className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Category</label>
                <select
                  value={editingProject.category}
                  onChange={(e) => {
                    setEditingProject({ ...editingProject, category: e.target.value });
                    setUpdateError('');
                    setUpdateSuccess('');
                  }}
                  className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
                >
                  <option value="">Select Category</option>
                  <option value="Education">Education</option>
                  <option value="Sports">Sports</option>
                  <option value="Charity">Charity</option>
                  <option value="Health & Medical">Health & Medical</option>
                  <option value="Environment">Environment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Short Summary</label>
              <input
                type="text"
                maxLength={500}
                value={editingProject.shortSummary || ''}
                onChange={(e) => {
                  setEditingProject({ ...editingProject, shortSummary: e.target.value });
                  setUpdateError('');
                  setUpdateSuccess('');
                }}
                placeholder="Summarize the core campaign goal in one sentence."
                className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Full Description</label>
              <textarea
                required
                rows={4}
                value={editingProject.description}
                onChange={(e) => {
                  setEditingProject({ ...editingProject, description: e.target.value });
                  setUpdateError('');
                  setUpdateSuccess('');
                }}
                className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
              />
            </div>

            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Target Goal (Rs.)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={editingProject.goal}
                  onChange={(e) => {
                    setEditingProject({ ...editingProject, goal: e.target.value });
                    setUpdateError('');
                    setUpdateSuccess('');
                  }}
                  className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  required
                  value={editingProject.startDate}
                  onChange={(e) => {
                    setEditingProject({ ...editingProject, startDate: e.target.value });
                    setUpdateError('');
                    setUpdateSuccess('');
                  }}
                  className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  required
                  value={editingProject.endDate}
                  onChange={(e) => {
                    setEditingProject({ ...editingProject, endDate: e.target.value });
                    setUpdateError('');
                    setUpdateSuccess('');
                  }}
                  className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Social Media Campaign Link</label>
              <input
                type="url"
                value={editingProject.socialMediaLink || ''}
                onChange={(e) => {
                  setEditingProject({ ...editingProject, socialMediaLink: e.target.value });
                  setUpdateError('');
                  setUpdateSuccess('');
                }}
                placeholder="https://facebook.com/events/..."
                className="bg-white px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-semibold text-slate-700 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-400 text-xs uppercase tracking-wide">Project Proposal (PDF) </label>
              <div className="flex items-center gap-3">
                <input
                  ref={editProposalInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    setProposalPdf(e.target.files?.[0] || null);
                    setUpdateError('');
                    setUpdateSuccess('');
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />

                {proposalPdf && (
                  <a
                    href={URL.createObjectURL(proposalPdf)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-50 hover:bg-blue-100 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-blue-700 text-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer h-full shrink-0"
                    title="View Selected PDF"
                  >
                    <ExternalLink size={14} /> View
                  </a>
                )}

                {!proposalPdf && editingProject.proposalPdfPath && (
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL}/${editingProject.proposalPdfPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-50 hover:bg-blue-100 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-blue-700 text-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer h-full shrink-0"
                    title="View Current Proposal"
                  >
                    <ExternalLink size={14} /> View
                  </a>
                )}
              </div>
              <p className="mt-1 text-slate-400 text-[10px] font-semibold">Upload a project proposal PDF. Required. Max size: 10MB.</p>
            </div>

            {updateError && (
              <div className="flex items-center gap-2 bg-red-50 p-4 border border-red-100 rounded-xl font-semibold text-red-600 text-sm mt-4">
                <AlertCircle size={16} />
                {updateError}
              </div>
            )}
            {updateSuccess && (
              <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-xl font-semibold text-emerald-600 text-sm mt-4">
                {updateSuccess}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end items-center gap-3 pt-3 border-slate-100 border-t shrink-0">
              <button
                type="button"
                onClick={handleResetEdit}
                className="hover:bg-slate-50 px-5 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 text-sm transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-md px-6 py-3 rounded-xl font-bold text-white text-sm active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  // =========================================================================
  // DELETE PROJECT FEATURE
  // =========================================================================

  // --- Delete Project State ---
  // States and actions to drop a campaign (restricted to projects with 0 donations)
  const [confirmDelete, setConfirmDelete] = useState(null);

  // --- Delete Project Functions ---
  const handleDelete = (projectID, donationCount) => {
    if (donationCount > 0) {
      openResultModal('error', 'Cannot Delete', 'This project cannot be deleted because it has active donations or payment slips.');
      return;
    }
    setConfirmDelete({ projectID });
  };

  // --- Delete Project API ---
  // Dispatches delete request for target project ID to backend API
  const handleConfirmDelete = async () => {
    if (!confirmDelete?.projectID) return;

    try {
      const response = await deleteProject(confirmDelete.projectID, userState?.userID);

      if (response.data.success) {
        await fetchProjects();
        openResultModal('success', 'Success!', response.data.message || 'Project deleted successfully.');
      } else {
        openResultModal('error', 'Delete Failed', response.data.message || 'Failed to delete project.');
      }
    } catch (err) {
      openResultModal('error', 'Delete Failed', err.response?.data?.message || 'Error deleting project.');
    } finally {
      setConfirmDelete(null);
    }
  };

  // --- Delete Project UI ---
  const renderDeleteConfirmModal = () => {
    if (!confirmDelete) return null;
    return (
      <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white shadow-2xl p-8 rounded-2xl w-[90%] max-w-sm">
          <h2 className="font-bold text-slate-800 text-xl">Delete project?</h2>
          <p className="mt-2 text-slate-600">Are you sure you want to permanently delete this project?</p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setConfirmDelete(null)}
              className="hover:bg-slate-50 px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };


  // =========================================================================
  // PROGRESS UPDATE FEATURE
  // =========================================================================

  // --- Progress Update State ---
  // States, refs, and validation logic to post public progress updates
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressProjectID, setProgressProjectID] = useState(null);
  const [progressProjectTitle, setProgressProjectTitle] = useState('');
  const [progressProjectCurrent, setProgressProjectCurrent] = useState(0);

  const [puTitle, setPuTitle] = useState('');
  const [puDescription, setPuDescription] = useState('');
  const [puPercent, setPuPercent] = useState(50);
  const [puMilestone, setPuMilestone] = useState('');
  const [puPhotos, setPuPhotos] = useState([]);
  const [puVideos, setPuVideos] = useState([]);
  const [puMessage, setPuMessage] = useState({ type: '', text: '' });
  const [puSubmitting, setPuSubmitting] = useState(false);

  // --- Progress Update Refs ---
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // --- Progress Update Helpers ---
  const resetProgressForm = (currentProgress = progressProjectCurrent) => {
    setPuTitle('');
    setPuDescription('');
    setPuPercent(currentProgress);
    setPuMilestone('');
    setPuPhotos([]);
    setPuVideos([]);
    setPuMessage({ type: '', text: '' });
    if (photoInputRef.current) photoInputRef.current.value = null;
    if (videoInputRef.current) videoInputRef.current.value = null;
  };

  const openProgressModal = (project) => {
    setProgressProjectID(project.id);
    setProgressProjectTitle(project.title);
    setProgressProjectCurrent(project.progressPercent ?? 0);
    resetProgressForm(project.progressPercent ?? 0);
    setPuMessage({ type: '', text: '' });
    setShowProgressModal(true);
  };

  // --- Progress Update Validation ---
  const validateProgressUpdate = ({ title, description, progressPercent, milestone, photos = [], videos = [], currentProjectProgress = 0 }) => {
    const trimmedTitle = title?.trim() ?? '';
    const trimmedDescription = description?.trim() ?? '';
    const trimmedMilestone = milestone?.trim() ?? '';

    if (!trimmedTitle) {
      return 'Update title is required.';
    }
    if (trimmedTitle.length < 5) {
      return 'Update title must be at least 5 characters long.';
    }
    if (trimmedTitle.length > 100) {
      return 'Update title must be 100 characters or fewer.';
    }
    if (/^\d+$/.test(trimmedTitle)) {
      return 'Update title cannot contain only numbers.';
    }
    if (!/[A-Za-z]/.test(trimmedTitle)) {
      return 'Update title must contain at least one alphabetic letter.';
    }
    if (!/[A-Za-z0-9]/.test(trimmedTitle)) {
      return 'Update title cannot be made only of symbols or spaces.';
    }

    if (!trimmedDescription) {
      return 'Description is required.';
    }
    if (trimmedDescription.length < 20) {
      return 'Description must be at least 20 characters long.';
    }
    if (trimmedDescription.length > 1000) {
      return 'Description must be 1000 characters or fewer.';
    }

    const progressValue = Number(progressPercent);
    if (!progressValue) {
      return 'Progress percentage is required.';
    }
    if (!Number.isFinite(progressValue)) {
      return 'Progress percentage must be a valid number.';
    }
    if (progressValue > 100) {
      return 'Progress percentage cannot exceed 100%.';
    }
    if (progressValue <= currentProjectProgress) {
      return `Progress percentage must be greater than the current project progress (${currentProjectProgress}%).`;
    }

    if (trimmedMilestone) {
      if (trimmedMilestone.length > 150) {
        return 'Milestone must be 150 characters or fewer.';
      }
      if (/^\d+$/.test(trimmedMilestone)) {
        return 'Milestone cannot contain only numbers.';
      }
    }

    if (!photos || photos.length === 0) {
      return 'At least one  photo is required.';
    }
    if (photos && photos.length > 5) {
      return 'You can upload up to 5 photos.';
    }

    const allowedPhotoTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
    const maxPhotoSize = 10 * 1024 * 1024;

    if (photos) {
      for (const photo of photos) {
        if (!allowedPhotoTypes.includes(photo?.type)) {
          return 'Each photo must be a JPG, PNG, or WebP image.';
        }
        if (photo.size > maxPhotoSize) {
          return 'Each photo must be 10 MB or smaller.';
        }
      }
    }

    if (videos.length > 3) {
      return 'You can upload up to 3 videos.';
    }

    for (const videoFile of videos) {
      const isMp4 =
        videoFile?.type === 'video/mp4' ||
        /\.mp4$/i.test(videoFile?.name || '');

      if (!isMp4) {
        return 'Each video must be an MP4 file.';
      }

      if (videoFile.size > 50 * 1024 * 1024) {
        return 'Each video must be 50 MB or smaller.';
      }
    }

    return '';
  };

  // --- Progress Update API ---
  // Bundles progress metrics, photo file arrays, and videos into FormData and posts to update API
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    setPuMessage({ type: '', text: '' });

    const validationMessage = validateProgressUpdate({
      title: puTitle,
      description: puDescription,
      progressPercent: puPercent,
      milestone: puMilestone,
      photos: puPhotos,
      videos: puVideos,
      currentProjectProgress: progressProjectCurrent,
    });

    if (validationMessage) {
      setPuMessage({ type: 'error', text: validationMessage });
      return;
    }

    const form = new FormData();
    form.append('projectID', progressProjectID);
    form.append('title', puTitle.trim());
    form.append('description', puDescription.trim());
    form.append('progressPercent', String(puPercent));
    form.append('milestone', puMilestone.trim());
    puPhotos.forEach(f => form.append('photos[]', f));
    puVideos.forEach(f => form.append('videos[]', f));

    try {
      setPuSubmitting(true);
      const res = await createProgressUpdate(form);
      const responseData = typeof res.data === 'string' ? (() => {
        try { return JSON.parse(res.data); } catch { return { raw: res.data }; }
      })() : res.data;
      console.log('Publish Progress Update response', res.status, responseData);

      const successResponse = responseData && (
        responseData.success === true ||
        responseData.success === 1 ||
        responseData.success === '1' ||
        responseData.success === 'true'
      );

      if (res.status === 200 && successResponse) {
        const successMessage = responseData.message || 'Progress update published successfully.';
        openResultModal('success', 'Success!', successMessage);
        resetProgressForm(Number(puPercent));
        setShowProgressModal(false);
        await fetchProjects();
      } else {
        const backendMessage = responseData?.message || JSON.stringify(responseData) || 'No details were returned from the server.';
        setPuMessage({ type: 'error', text: `Publish failed: ${backendMessage}` });
        console.error('Publish update returned unsuccessful payload:', res.status, responseData);
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data || err.message || 'Publish failed.';
      setPuMessage({ type: 'error', text: `Publish failed: ${serverMessage}` });
      console.error('Publish progress update error:', err);
    } finally {
      setPuSubmitting(false);
    }
  };

  // --- Progress Update UI ---
  const renderProgressUpdateModal = () => {
    if (!showProgressModal) return null;
    return (
      <div className="z-50 fixed inset-0 flex justify-center items-center bg-slate-950/30 backdrop-blur-sm p-3 sm:p-4">
        <div className="flex flex-col bg-white shadow-2xl border border-slate-100 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center p-6 border-slate-100 border-b shrink-0">
            <div>
              <h3 className="font-black text-slate-800 text-xl">
                Publish Progress Update
              </h3>
              <p className="text-slate-500 text-sm">
                Project: <span className="font-semibold">{progressProjectTitle}</span>
              </p>
            </div>

            <button
              onClick={() => {
                setShowProgressModal(false);
                resetProgressForm();
              }}
              className="hover:bg-slate-50 p-2 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold text-slate-700 text-sm">Update Title  <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  value={puTitle}
                  onChange={(e) => { setPuTitle(e.target.value); setPuMessage({ type: '', text: '' }); }}
                  className="px-4 py-3 border border-slate-300 focus:border-blue-500 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 w-full text-sm"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-700 text-sm">Description  <span class="text-red-500">*</span></label>
                <textarea
                  value={puDescription}
                  onChange={(e) => { setPuDescription(e.target.value); setPuMessage({ type: '', text: '' }); }}
                  rows={5}
                  className="px-4 py-3 border border-slate-300 focus:border-blue-500 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 w-full text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 text-sm">Progress  <span class="text-red-500">*</span></label>
                <input
                  type="range"
                  min={progressProjectCurrent}
                  max="100"
                  value={puPercent}
                  onChange={(e) => { setPuPercent(Number(e.target.value)); setPuMessage({ type: '', text: '' }); }}
                  className="bg-blue-600 w-full h-2"
                />
                <div className="mt-1 flex items-center justify-between text-slate-500 text-sm">
                  <span>{puPercent}%</span>
                  <span>Current progress: {progressProjectCurrent}%</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-semibold text-slate-700 text-sm">Milestone / Stage</label>
                <input
                  type="text"
                  value={puMilestone}
                  onChange={(e) => { setPuMilestone(e.target.value); setPuMessage({ type: '', text: '' }); }}
                  className="px-4 py-3 border border-slate-300 focus:border-blue-500 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 w-full text-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-5">
                  <label className="block mb-2 text-sm font-semibold text-slate-700">Photos  <span class="text-red-500">*</span></label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => { setPuPhotos(Array.from(e.target.files || [])); setPuMessage({ type: '', text: '' }); }}
                    className="w-full rounded-3xl border border-slate-300 bg-white p-3 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Upload JPG, PNG, WEBP. Up to 5 photos.
                  </p>

                  {puPhotos.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {puPhotos.map((file, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
                          <span className="truncate flex-1">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...puPhotos];
                              updated.splice(index, 1);
                              setPuPhotos(updated);
                              if (updated.length === 0 && photoInputRef.current) {
                                photoInputRef.current.value = '';
                              }
                            }}
                            aria-label="Remove photo"
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer ml-1 text-sm leading-none flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 font-semibold italic">No photos selected</p>
                  )}
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-5">
                  <label className="block mb-2 text-sm font-semibold text-slate-700">Video (optional)</label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4"
                    multiple
                    onChange={(e) => { setPuVideos(Array.from(e.target.files || [])); setPuMessage({ type: '', text: '' }); }}
                    className="w-full rounded-3xl border border-slate-300 bg-white p-3 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Upload MP4 only. Max size: 50MB per video. Up to 3 videos.
                  </p>

                  {puVideos.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {puVideos.map((file, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
                          <span className="truncate flex-1">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...puVideos];
                              updated.splice(index, 1);
                              setPuVideos(updated);
                              if (updated.length === 0 && videoInputRef.current) {
                                videoInputRef.current.value = '';
                              }
                            }}
                            aria-label="Remove video"
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer ml-1 text-sm leading-none flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 font-semibold italic">No videos selected</p>
                  )}
                </div>
              </div>

              {puMessage.text && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${puMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {puMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => resetProgressForm()} className="px-4 py-2 border border-slate-200 rounded-lg">Clear </button>
                <button type="submit" disabled={puSubmitting} className="bg-blue-600 px-5 py-2 rounded-lg font-semibold text-white">
                  {puSubmitting ? 'Publishing...' : 'Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };


  // ==========================================
  // RESULT MODAL FEATURE
  // ==========================================

  // --- Result Modal State ---
  // State and toggles to show success or error transaction modal popups
  const [resultModal, setResultModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  // --- Result Modal Functions ---
  const openResultModal = (type, title, message) => {
    setResultModal({ isOpen: true, type, title, message });
  };

  const closeResultModal = () => {
    setResultModal({ isOpen: false, type: 'success', title: '', message: '' });
  };

  // --- Result Modal UI ---
  const renderResultModal = () => {
    if (!resultModal.isOpen) return null;
    return (
      <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white shadow-2xl p-8 rounded-2xl w-[90%] max-w-sm animate-in duration-300 fade-in zoom-in">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${resultModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {resultModal.type === 'success' ? (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>

          <h2 className="mb-2 font-bold text-xl text-center">{resultModal.title}</h2>
          <p className="mb-6 text-slate-600 text-center">{resultModal.message}</p>

          <button
            onClick={closeResultModal}
            className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition ${resultModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            OK
          </button>
        </div>
      </div>
    );
  };


  // ==========================================
  // PROJECT TABLE FEATURE
  // ==========================================

  // --- Project Table UI ---
  const renderProjectTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center gap-3 py-16">
          <div className="border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 animate-spin"></div>
          <span className="font-bold text-slate-400 text-sm">Loading campaign projects...</span>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="bg-slate-50/50 py-16 border border-slate-200 border-dashed rounded-2xl text-center">
          <div className="mb-4 text-slate-300 text-5xl">📂</div>
          <h3 className="font-black text-slate-800 text-lg">No Active Projects</h3>
          <p className="mx-auto mt-1 max-w-sm font-semibold text-slate-400 text-sm">
            You don't have any active campaigns right now. Create a new campaign to connect with donors.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-slate-100 border-b font-black text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Campaign details</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Goal & Raised</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-sm">
            {projects.map((p) => {
              const percent = Math.min(100, Math.round((p.raised / p.goal) * 100));
              const cannotDelete = p.donationCount > 0;

              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-800 text-base leading-snug">{p.title}</span>

                      {p.status === 'SUSPENDED' && (
                        <span className="mt-1 font-extrabold text-red-600 text-xs tracking-wider uppercase">
                          SUSPENDED
                        </span>
                      )}

                      {(p.status === 'COMPLETED' || (p.endDate && new Date(p.endDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0))) && p.status !== 'SUSPENDED' && p.status !== 'REJECTED' && (
                        <span className="mt-1 font-extrabold text-emerald-600 text-xs tracking-wider uppercase">
                          COMPLETED
                        </span>
                      )}

                      {p.status === 'REJECTED' && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 w-fit">
                            REJECTED
                          </span>
                          {p.rejectionReason && (
                            <span className="text-slate-500 text-xs italic font-semibold mt-0.5 leading-normal">
                              Reason: {p.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}

                      {p.socialMediaLink && (
                        <a
                          href={p.socialMediaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-1 font-bold text-blue-500 hover:text-blue-600 text-xs"
                        >
                          <ExternalLink size={12} />
                          Campaign Link
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 capitalize">{p.category}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-emerald-600">Rs. {p.raised.toLocaleString()}</span>
                      <span className="mt-0.5 text-slate-400 text-xs">Goal: Rs. {p.goal.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 w-40">
                    <div className="flex flex-col gap-1.5">
                      <div className="bg-slate-100 rounded-full w-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-500 text-xs">{percent}% Funded</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(p.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(p.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {p.status === 'REJECTED' ? (
                        <button
                          disabled
                          className="flex justify-center items-center bg-slate-100 p-2 rounded-lg text-slate-400 cursor-not-allowed"
                          title="Cannot edit details because this project has been rejected."
                        >
                          <Edit2 size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => openEditModal(p)}
                          className="flex justify-center items-center bg-blue-50 hover:bg-blue-100 p-2 rounded-lg text-blue-600 transition-colors cursor-pointer"
                          title="Update project details"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      {p.status === 'SUSPENDED' || p.status === 'REJECTED' ? (
                        <button
                          disabled
                          className="flex justify-center items-center bg-slate-100 p-2 rounded-lg text-slate-400 cursor-not-allowed"
                          title={p.status === 'SUSPENDED'
                            ? "Progress updates are unavailable while this project is suspended."
                            : "Progress updates are unavailable because this project has been rejected."
                          }
                        >
                          <BarChart3 size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => openProgressModal(p)}
                          className="flex justify-center items-center bg-sky-50 hover:bg-sky-100 p-2 rounded-lg text-sky-600 transition-colors cursor-pointer"
                          title="Add or view progress updates"
                        >
                          <BarChart3 size={16} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(p.id, p.donationCount)}
                        disabled={cannotDelete || p.status === 'SUSPENDED' || p.status === 'REJECTED'}
                        className={`p-2 rounded-lg transition-colors flex items-center justify-center ${(cannotDelete || p.status === 'SUSPENDED' || p.status === 'REJECTED')
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                          }`}
                        title={p.status === 'SUSPENDED' || p.status === 'REJECTED'
                          ? `This project cannot be deleted because it is ${p.status.toLowerCase()}`
                          : cannotDelete
                            ? 'Cannot delete campaign with active donations or payment slips'
                            : 'Delete campaign'
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };


  // =========================================================================
  // MAIN RETURN
  // =========================================================================
  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      <Sidebar
        activeTab="my-project"
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-6 sm:space-y-8 mx-auto p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl">
          {/* Header */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-2xl sm:text-3xl md:text-4xl tracking-tight">
              My Active Campaigns
            </h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Manage your ongoing fundraising campaigns, post milestone updates, and edit project details.
            </p>
          </div>

          <div className="relative bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 sm:p-8 border border-slate-100/80 rounded-3xl">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 mb-6 p-4 border border-red-100 rounded-2xl font-semibold text-red-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Project Table */}
            {renderProjectTable()}

            {/* Feature Modals */}
            {renderProgressUpdateModal()}
            {renderEditProjectModal()}
            {renderDeleteConfirmModal()}
            {renderResultModal()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyProject;
