import { useState, useRef } from "react";
import Sidebar from './component/sidebar';
import { createProject } from '../../services/authService';

// Note: Cancel will be implemented as an in-place Reset inside the component


// List of categories verified by the system to filter projects
const allowedCategories = [
  'Education',
  'Sports',
  'Charity',
  'Health & Medical',
  'Environment',
  'Other'
];

// ==================== Date Helper Utilities ====================
// Retrieves current date in YYYY-MM-DD format for baseline comparisons
const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
};

// ==================== Validation Logic ====================
// Frontend validation ensuring inputs meet constraints before server requests
const validateProject = ({ formData, coverImage, proposalPdf, galleryImages = [], galleryVideos = []}) => {
  if (!formData.title.trim()) return 'Project title is required.';
   // Title cannot consist of only numbers
  if (/^\d+$/.test(formData.title))
    return 'Project title cannot contain only numbers.';

  // Title must contain at least one letter (recommended)
  if (!/[A-Za-z]/.test(formData.title))
    return 'Project title must contain at least one letter.';
  if (formData.title.trim().length > 150) return 'Project title must be 150 characters or fewer.';
  if (!allowedCategories.includes(formData.category)) return 'Please select a valid project category.';
  if (!formData.description.trim()) return 'Detailed description is required.';
  if (!formData.shortSummary || !formData.shortSummary.trim()) return 'Short summary is required.';
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

  if (!coverImage) return 'Please upload a project cover image.';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(coverImage.type)) {
    return 'Cover image must be a JPG, PNG, or WEBP file.';
  }
  if (coverImage.size > 10 * 1024 * 1024) return 'Cover image must be 10MB or smaller.';

  if (!proposalPdf) return 'Please upload a project proposal PDF.';
  if (proposalPdf.type !== 'application/pdf') return 'Proposal document must be a PDF file.';
  if (proposalPdf.size > 10 * 1024 * 1024) return 'Proposal document must be 10MB or smaller.';
  // Validate gallery images
  if (galleryImages.length > 5) {
    return 'You can upload up to 5 photos.';
  }

  const allowedPhotoTypes = [
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const maxPhotoSize = 10 * 1024 * 1024; // 10 MB

  for (const photo of galleryImages) {
    if (!allowedPhotoTypes.includes(photo?.type)) {
      return 'Each photo must be a JPG, PNG, or WebP image.';
    }

    if (photo.size > maxPhotoSize) {
      return 'Each photo must be 10 MB or smaller.';
    }
  }

  if (galleryVideos.length > 1) {
  return 'You can upload only 1 video.';
}

if (galleryVideos.length === 1) {
  const video = galleryVideos[0];

  const isMp4 =
    video?.type === 'video/mp4' ||
    /\.mp4$/i.test(video?.name || '');

  if (!isMp4) {
    return 'Video must be an MP4 file.';
  }

  if (video.size > 50 * 1024 * 1024) {
    return 'Video must be 50 MB or smaller.';
  }
}

  return '';
};

// ==================== Organizer Create Project Component ====================
const CreateProject = () => {
  // initialForm: tracks default blank state values
  const initialForm = {
    title: '',
    category: '',
    shortSummary: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: '',
    socialMediaLink: ''
  };

  // Form states to track inputs and selected file resources
  const [formData, setFormData] = useState(initialForm);
  const [coverImage, setCoverImage] = useState(null);
  const [proposalPdf, setProposalPdf] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryVideos, setGalleryVideos] = useState([]);

  // DOM input references utilized to reset file fields upon form clear
  const galleryImagesInputRef = useRef(null);
  const galleryVideosInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const proposalPdfInputRef = useRef(null);

  // Removes selected gallery photos from the preview state list
  const handleRemoveImage = (index) => {
    setGalleryImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 && galleryImagesInputRef.current) {
        galleryImagesInputRef.current.value = '';
      }
      return updated;
    });
  };

  // Removes selected gallery videos from the preview state list
  const handleRemoveVideo = (index) => {
    setGalleryVideos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 && galleryVideosInputRef.current) {
        galleryVideosInputRef.current.value = '';
      }
      return updated;
    });
  };

  // Confirmation states, alerts, loading indicators, and success modal toggles
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');



  // Reverts all form inputs to default values and clears file selection DOM states
  const handleReset = () => {
    // Immediately clear the form (no confirmation)
    setFormData(initialForm);
    setCoverImage(null);
    setProposalPdf(null);
    setGalleryImages([]);
    setGalleryVideos([]);
    if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    if (proposalPdfInputRef.current) proposalPdfInputRef.current.value = '';
    if (galleryImagesInputRef.current) galleryImagesInputRef.current.value = '';
    if (galleryVideosInputRef.current) galleryVideosInputRef.current.value = '';
    setIsConfirmed(false);
    setMessage({ type: '', text: '' });
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  // Updates input text state dynamically from form change events
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Assembles FormData, validates, sends payload to API, and shows success/error status
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!isConfirmed) {
      setMessage({
        type: 'error',
        text: 'Please confirm the information before submitting.'
      });
      return;
    }

    const validationMessage = validateProject({ formData, coverImage, proposalPdf, galleryImages, galleryVideos });
    if (validationMessage) {
      setMessage({ 
        type: 'error',
        text: validationMessage
      });
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.userID) {
      setMessage({
        type: 'error',
        text: 'Please sign in again to create a project.'
      });
      return;
    }

    const payload = new FormData();
    payload.append('userID', currentUser.userID);
    payload.append('title', formData.title);
    payload.append('category', formData.category);
    payload.append('shortSummary', formData.shortSummary);
    payload.append('description', formData.description);
    payload.append('targetAmount', formData.targetAmount);
    payload.append('startDate', formData.startDate);
    payload.append('endDate', formData.endDate);
    payload.append('socialMediaLink', formData.socialMediaLink);
    payload.append('coverImage', coverImage);

    if (proposalPdf) {
      payload.append('proposalPdf', proposalPdf);
    }

    galleryImages.forEach((file) => {
      payload.append('galleryImages[]', file);
    });


    galleryVideos.forEach((file) => {
      payload.append('galleryVideos[]', file);
    });

    try {
      setIsSubmitting(true);
      const response = await createProject(payload);
      const data = response.data;

      if (!data.success) {
        setMessage({
          type: 'error',
          text: data.message || 'Project creation failed.'
        });
        return;
      }

      setSuccessMessage(data.message || 'Project created successfully.');
      setShowSuccessModal(true);

      setFormData(initialForm);
      setCoverImage(null);
      setProposalPdf(null);
      setGalleryImages([]);
      setGalleryVideos([]);
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
      if (proposalPdfInputRef.current) proposalPdfInputRef.current.value = '';
      if (galleryImagesInputRef.current) galleryImagesInputRef.current.value = '';
      if (galleryVideosInputRef.current) galleryVideosInputRef.current.value = '';
      setIsConfirmed(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Something went wrong while creating the project.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      <Sidebar
        activeTab="create project"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-6 sm:space-y-8 mx-auto p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl">
          {/* Header */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-2xl sm:text-3xl md:text-4xl tracking-tight">
              Create New Project
            </h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Create a fundraising campaign for your university club or student initiative and connect with donors.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 text-lg font-semibold text-blue-700 sm:text-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                General Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Project Title <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title"
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Category <span class="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Short Summary <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    name="shortSummary"
                    value={formData.shortSummary}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="A brief overview of the project..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Detailed Description <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Describe the project, expected impact, timeline and objectives..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 text-lg font-semibold text-blue-700 sm:text-xl">
                Funding & Goals
              </h2>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Fundraising Target (LKR) <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="targetAmount"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    placeholder="500000"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Start Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    End Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 text-lg font-semibold text-blue-700 sm:text-xl">
                Media & Proof
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block mb-3 text-sm font-medium text-slate-700">
                    Project Cover Image <span class="text-red-500">*</span>
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center sm:p-10">
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                       className="w-full max-w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Upload JPG, PNG, or WEBP. Max size: 10MB.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm font-medium text-slate-700">
                    Social Media Link
                  </label>
                  <input
                    type="url"
                    name="socialMediaLink"
                    value={formData.socialMediaLink}
                    onChange={handleInputChange}
                    placeholder="Paste social media URL"
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-sm font-medium text-slate-700">
                    Project Proposal (PDF) <span class="text-red-500">*</span>
                  </label>
                  <input
                    ref={proposalPdfInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setProposalPdf(e.target.files?.[0] || null)}
                    required
                    className="w-full max-w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Upload a project proposal PDF. Max size: 10MB.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 sm:text-xl">
                    Supporting Gallery
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload photos and video that support your project story.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-dashed border-slate-300 p-5">
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Images
                  </label>
                  <input
                    type="file"
                    ref={galleryImagesInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => setGalleryImages(Array.from(e.target.files || []))}
                    className="w-full max-w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                     Upload JPG, PNG, WEBP. Up to 5 photos.
                  </p>

                  <div className="mt-3">
                    {galleryImages.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-3">
                        {galleryImages.map((file, index) => (
                          <div key={index} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 max-w-[180px]">
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              aria-label="Remove image"
                              className="text-red-500 hover:text-red-700 text-lg font-bold focus:outline-none transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No photos selected</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 p-5">
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Videos
                  </label>
                  <input
                    type="file"
                    ref={galleryVideosInputRef}
                    accept="video/*"
                    multiple
                    onChange={(e) => setGalleryVideos(Array.from(e.target.files || []))}
                    className="w-full max-w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Upload MP4 only. Max size: 50MB.
                  </p>

                  <div className="mt-3">
                    {galleryVideos.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-3">
                        {galleryVideos.map((file, index) => (
                          <div key={index} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 max-w-[180px]">
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(index)}
                              aria-label="Remove video"
                              className="text-red-500 hover:text-red-700 text-lg font-bold focus:outline-none transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No video selected</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {message.text && (
              <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                {message.text}
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={() => setIsConfirmed(!isConfirmed)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  I confirm that the information provided is accurate.
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Clear 
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </div>
            </section>
          </form>
        </div>
      </main>
      {showSuccessModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-[90%] animate-in fade-in zoom-in duration-300">

      <div className="flex justify-center mb-4">
        <div className="bg-green-100 p-3 rounded-full">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-center mb-2">
        Success!
      </h2>

      <p className="text-center text-slate-600 mb-6">
        {successMessage}
      </p>

      <button
        onClick={() => setShowSuccessModal(false)}
        className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white py-3 font-semibold"
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
    
    
  );
};

export default CreateProject;