import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Trash2 } from 'lucide-react';
// authService endpoints for user profiles and profile image assets
import { getUserProfile, updateUserProfile, uploadProfilePhoto, deleteProfilePhoto } from '../../../../services/authService';
// ConfirmModal: standard reusable component prompt confirmation window
import ConfirmModal from '../../../common/component/ConfirmModal';
// useAuth: context hook giving access to login/session variables
import { useAuth } from '../../../../context/AuthContext';
import { compressImage } from '../../../../utils/imageCompressor';

// ==================== Organizer Profile Settings Card Component ====================
const OrganizerProfileSettingsCard = () => {
  // profile: local copy of loaded user & club attributes
  const [profile, setProfile] = useState({
    userID: '',
    rawUserID: '',
    organizerID: '',
    organizationName: '',
    universityName: '',
    verificationStatus: '',
    verifiedDate: '',
    fullName: '',
    email: '',
    role: '',
    profilePhoto: null
  });
  // Loading indicators for data fetching, saving, and image uploading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imgError, setImgError] = useState(false);
  // Modal visibility trigger for deleting profile picture
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);
  const { updateProfilePhoto, updateProfileDetails, currentUser } = useAuth();

  useEffect(() => {
    setImgError(false);
  }, [profile.profilePhoto]);

  // Pull profile information from the backend when page load starts
  useEffect(() => {
    // Replace with real Auth Context in production
    const currentUserID = parseInt(localStorage.getItem('userID')) || 2; 

    const fetchProfile = async () => {
      try {
        const response = await getUserProfile(currentUserID);
        if (response.data.success) {
          const user = response.data.user;
          const org = response.data.organizer || {};
          setProfile({
            userID: `USR-${user.userID.toString().padStart(4, '0')}`,
            rawUserID: user.userID,
            organizerID: org.organizerID ? `ORG-${new Date().getFullYear()}-${org.organizerID.toString().padStart(4, '0')}` : 'N/A',
            organizationName: org.organizationName || '',
            universityName: org.universityName || '',
            verificationStatus: org.verificationStatus || 'PENDING',
            verifiedDate: org.verifiedDate ? org.verifiedDate.split(' ')[0] : 'N/A',
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role,
            profilePhoto: user.profilePhoto || null
          });
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handles text change updates inside the local profile state object
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Assembles profile photo file inside FormData and sends payload to API
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setMessage({ text: '', type: '' });

    try {
      const optimized = await compressImage(file, 800, 0.85);
      const formData = new FormData();
      formData.append('profilePhoto', optimized);

      const response = await uploadProfilePhoto(formData);
      if (response.data.success) {
        const photoUrl = response.data.profilePhoto + "?v=" + Date.now();
        setProfile(prev => ({ ...prev, profilePhoto: photoUrl }));
        updateProfilePhoto(photoUrl);
        setMessage({ text: 'Profile photo updated successfully!', type: 'success' });
      } else {
        setMessage({ text: response.data.message || 'Photo update failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error uploading photo.', type: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Dispatches request to clear user profile image asset from directory
  const handleDeletePhoto = async () => {
    setUploadingPhoto(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await deleteProfilePhoto();
      if (response.data.success) {
        setProfile(prev => ({ ...prev, profilePhoto: null }));
        updateProfilePhoto(null);
        setMessage({ text: 'Profile photo removed successfully!', type: 'success' });
      } else {
        setMessage({ text: response.data.message || 'Failed to remove photo', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error removing photo.', type: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Sends updated full name, email, and club parameters to the backend
  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await updateUserProfile({
        userID: profile.rawUserID,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role,
        organizationName: profile.organizationName,
        universityName: profile.universityName
      });
      if (response.data.success) {
        updateProfileDetails({ fullName: profile.fullName, email: profile.email });
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setMessage({ text: response.data.message || 'Update failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full flex items-center justify-center">
        <span className="text-gray-500 font-medium">Loading profile data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <User className="text-[#0D5BFF]" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Organizer Information</h2>
          </div>
          {message.text && (
            <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-8 mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl bg-orange-100 border border-orange-200 overflow-hidden flex items-center justify-center relative">
               {profile.profilePhoto && !imgError ? (
                 <img 
                   src={profile.profilePhoto.startsWith('http')
                     ? profile.profilePhoto
                     : `${(import.meta.env.VITE_BACKEND_URL || 'https://fundup-backend-cbfbh7d5gtdscxgg.southafricanorth-01.azurewebsites.net').replace(/\/+$/, '')}/${profile.profilePhoto.replace(/^\/+/, '')}`} 
                   alt="Profile" 
                   className="w-full h-full object-cover" 
                   onError={() => setImgError(true)}
                 />
               ) : (
                 <div className="w-full h-full bg-[#fca5a5] flex items-center justify-center text-white font-bold text-4xl uppercase">
                   {(profile.fullName || 'User').substring(0, 2)}
                 </div>
               )}
               {uploadingPhoto && (
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-xs">Uploading...</span>
                 </div>
               )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png, image/jpg, image/gif" 
              onChange={handlePhotoChange} 
            />
            <div className="flex flex-wrap gap-4 items-center justify-center mt-2">
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingPhoto}
                className="text-[#0D5BFF] text-sm font-medium hover:underline disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
              {profile.profilePhoto && (
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={uploadingPhoto}
                  className="text-red-500 text-sm font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input 
                type="text" 
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5BFF] focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5BFF] focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Organizer ID
              </label>
              <input 
                type="text" 
                value={profile.organizerID}
                disabled
                className="w-full h-12 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                User ID
              </label>
              <input 
                type="text" 
                value={profile.userID}
                disabled
                className="w-full h-12 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Organization Name
              </label>
              <input 
                type="text" 
                name="organizationName"
                value={profile.organizationName}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5BFF] focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                University Name
              </label>
              <input 
                type="text" 
                name="universityName"
                value={profile.universityName}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5BFF] focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Verification Status
              </label>
              <input 
                type="text" 
                value={profile.verificationStatus}
                disabled
                className={`w-full h-12 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium ${profile.verificationStatus === 'VERIFIED' ? 'text-green-600' : 'text-orange-500'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Verified Date
              </label>
              <input 
                type="text" 
                value={profile.verifiedDate}
                disabled
                className="w-full h-12 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 transition-all w-full sm:w-auto text-center active:scale-95"
        >
          Discard
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200/60 w-full sm:w-auto text-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePhoto}
        title="Remove Photo"
        message="Are you sure you want to remove your profile photo? This action cannot be undone."
        confirmText="Remove"
      />
    </div>
  );
};

export default OrganizerProfileSettingsCard;
