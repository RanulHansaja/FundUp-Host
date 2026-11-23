import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Trash2 } from 'lucide-react';
import { getUserProfile, updateUserProfile, uploadProfilePhoto, deleteProfilePhoto } from '../../../../services/authService';
import ConfirmModal from '../../../common/component/ConfirmModal';
import { useAuth } from '../../../../context/AuthContext';
import { compressImage } from '../../../../utils/imageCompressor';

const ProfileSettingsCard = () => {
  const [profile, setProfile] = useState({
    userID: '',
    rawUserID: '',
    fullName: '',
    email: '',
    bio: '',
    profilePhoto: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);
  const { updateProfilePhoto, updateProfileDetails, currentUser } = useAuth();

  useEffect(() => {
    setImgError(false);
  }, [profile.profilePhoto]);

  useEffect(() => {
    // Replace with real Auth Context in production
    const currentUserID = parseInt(localStorage.getItem('userID')) || 1; 

    const fetchProfile = async () => {
      try {
        const response = await getUserProfile(currentUserID);
        if (response.data.success) {
          const user = response.data.user;
          const donorData = response.data.donor || {};
          
          setProfile(prev => ({
            ...prev,
            userID: `DON-${new Date().getFullYear()}-${user.userID.toString().padStart(4, '0')}`,
            rawUserID: user.userID,
            fullName: user.fullName,
            email: user.email,
            bio: donorData.bio || '',
            profilePhoto: user.profilePhoto || null,
          }));
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

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

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await updateUserProfile({
        userID: profile.rawUserID,
        fullName: profile.fullName,
        email: profile.email,
        role: 'DONOR',
        bio: profile.bio
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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 md:p-8 flex-1">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <User className="text-blue-600" size={20} />
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Personal Information</h2>
          </div>
          {message.text && (
            <span className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
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
            <div className="flex gap-4 items-center mt-2">
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingPhoto}
                className="text-blue-600 text-sm font-semibold hover:underline disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
              {profile.profilePhoto && (
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={uploadingPhoto}
                  className="text-red-500 text-sm font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input 
                type="text" 
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Organizer ID
              </label>
              <input 
                type="text" 
                value={profile.userID}
                disabled
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-semibold cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
            Bio
          </label>
          <textarea 
            rows="4"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-800 font-semibold resize-none leading-relaxed"
          ></textarea>
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

export default ProfileSettingsCard;
