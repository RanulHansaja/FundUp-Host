import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  logout as apiLogout,
  getDonorNotifications,
  markDonorNotificationsRead,
  getUserProfile
} from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

const Sidebar = ({
  activeTab = 'dashboard',
  setActiveTab = () => { },
  onLogout = () => { },
  sidebarOpen = false,
  setSidebarOpen = () => { },
  user: userProp,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout: contextLogout } = useAuth();
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [dynamicBadge, setDynamicBadge] = useState('Loading...');
  const isSidebarOpen = typeof sidebarOpen === 'boolean' ? sidebarOpen : internalSidebarOpen;

  const loadNotifications = async () => {
    try {
      setNotificationsError(null);
      const response = await getDonorNotifications();
      if (response.data?.success) {
        const list = response.data.data?.notifications || [];
        setNotifications(list);
        setUnseenCount(list.filter((item) => item.unread).length);
      } else {
        setNotificationsError(response.data?.message || 'Unable to load notifications.');
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setNotificationsError('Unable to load notifications.');
    }
  };

  const openNotifications = async () => {
    setShowNotificationsPopup(true);
    setNotificationsLoading(true);
    await loadNotifications();
    try {
      const markResponse = await markDonorNotificationsRead();
      if (markResponse.data?.success) {
        setUnseenCount(0);
        setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
      }
    } catch (error) {
      console.error('Mark notifications read failed:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const closeNotifications = () => setShowNotificationsPopup(false);

  const handleNotificationsClick = () => {
    if (showNotificationsPopup) {
      closeNotifications();
      return;
    }
    openNotifications();
  };

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      loadNotifications();
    }, 0);

    const fetchProfileBadge = async () => {
      try {
        if (currentUser?.userID) {
          const res = await getUserProfile(currentUser.userID);
          if (res.data?.success) {
            let fetchedBadge = res.data.donor?.badgeLevel || 'NONE';
            if (fetchedBadge === 'NONE' && res.data.donor?.totalDonation >= 5000) {
              fetchedBadge = 'STARTER';
            }
            setDynamicBadge(fetchedBadge);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile for badge', err);
        setDynamicBadge('NONE');
      }
    };
    fetchProfileBadge();

    return () => window.clearTimeout(fetchTimer);
  }, []);

  const setMenuOpen = (value) => {
    if (typeof setSidebarOpen === 'function') {
      setSidebarOpen(value);
    }
    setInternalSidebarOpen(value);
  };

  const sidebarUser = {
    ...userProp,
    name: currentUser?.fullName || userProp?.name || 'Donor',
    role: currentUser?.role || userProp?.role || 'Donor',
    email: currentUser?.email || userProp?.email || 'donor@university.domain',
    badgeLevel: currentUser?.badgeLevel || userProp?.badgeLevel || 'NONE',
    profilePhoto: currentUser?.profilePhoto || null
  };

  const isSettingsPage = location.pathname === '/donor/profile-settings';
  const currentActiveTab = isSettingsPage ? 'settings' : activeTab;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'browse',
      label: 'Browse Projects',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 'donations',
      label: 'My Donations',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: 'payments',
      label: 'Payment Confirmations',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'recognition',
      label: 'Recognition & Badges',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Profile Settings',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleLogoutAction = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    apiLogout().catch(err => console.error("Logout API error:", err));
    contextLogout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white shadow-2xl mx-auto p-8 rounded-2xl w-[90%] max-w-sm animate-in duration-300 fade-in zoom-in">
            {/* Header */}
            <div className="flex justify-center items-center mb-4">
              <div className="bg-red-50 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Message */}
            <h2 className="mb-2 font-bold text-slate-900 text-xl text-center">
              Confirm Logout
            </h2>
            <p className="mb-6 text-slate-600 text-sm text-center">
              Are you sure you want to logout? You'll need to log in again to access the donor dashboard.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 hover:bg-slate-50 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-lg font-semibold text-white active:scale-95 transition-all duration-200"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}




      {!isSidebarOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden inline-flex top-4 right-4 z-40 fixed justify-center items-center bg-white hover:bg-slate-50 shadow-sm p-2.5 border border-slate-200 rounded-xl text-slate-700 transition"
          aria-label="Open Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {isSidebarOpen && (
        <div
          className="md:hidden z-20 fixed inset-0 bg-slate-900/40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-100
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* ── TOP SECTION ── */}
        <div className="flex flex-col flex-1 gap-6 p-6 min-h-0 overflow-y-auto">
          {/* Mobile close button */}
          <div className="md:hidden flex justify-end">
            <button
              onClick={() => setMenuOpen(false)}
              className="hover:bg-slate-50 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close Sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Card */}
          <div className="relative flex flex-col items-center bg-slate-50/70 p-5 border border-slate-100/80 rounded-2xl text-center">
            <button
              onClick={handleNotificationsClick}
              className="top-4 right-4 absolute bg-white hover:bg-slate-100 shadow-sm p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200"
              title="Notifications"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unseenCount > 0 && (
                <span className="-top-1 -right-1 absolute flex justify-center items-center bg-red-500 shadow-lg px-1.5 border border-white rounded-full min-w-4.5 h-5 font-black text-[10px] text-white leading-5 animate-pulse">
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </button>
            <div className="group relative">
              <div className="flex justify-center items-center bg-orange-100 shadow-sm border-2 border-blue-500 hover:border-blue-600 rounded-full w-16 h-16 overflow-hidden transition-colors duration-200 cursor-pointer shrink-0">
                {sidebarUser.profilePhoto ? (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}/${sidebarUser.profilePhoto}`}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex justify-center items-center bg-[#fca5a5] w-full h-full font-bold text-white text-2xl uppercase">
                    {sidebarUser.name.substring(0, 2)}
                  </div>
                )}
              </div>
              <span className="right-0 bottom-0 absolute bg-green-500 border-2 border-white rounded-full w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col items-center mt-3">
              <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Welcome back,</span>
              <h4 className="mt-0.5 font-extrabold text-slate-800 text-sm tracking-tight">{sidebarUser.name}</h4>
              {dynamicBadge && dynamicBadge !== 'NONE' && dynamicBadge !== 'Loading...' && (
                <span className="inline-block bg-indigo-50 mt-1.5 px-2.5 py-0.5 border border-indigo-100 rounded-full font-extrabold text-[9px] text-indigo-600 uppercase tracking-wider">
                  {dynamicBadge} Contributor
                </span>
              )}
              <span className="block mt-2 max-w-[200px] font-semibold text-[10px] text-slate-400 truncate">{sidebarUser.email}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'settings') {
                      navigate('/donor/profile-settings');
                    } else if (item.id === 'recognition') {
                      navigate('/donor/recognition-badges');
                    } else {
                      if (location.pathname !== '/donor-dashboard') {
                        navigate('/donor-dashboard', { state: { activeTab: item.id } });
                      } else {
                        setActiveTab(item.id);
                      }
                    }
                    setMenuOpen(false); // auto-close on mobile after selection
                  }}
                  className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500 pl-2.5'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}
                `}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── LOGOUT BUTTON ── */}
        <div className="p-6 border-slate-100 border-t shrink-0">
          <button
            onClick={handleLogoutAction}
            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-200/60 shadow-md px-4 py-3 rounded-full w-full font-bold text-white text-sm active:scale-[0.98] transition-all duration-200"
          >
            Log out
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        {showNotificationsPopup && (
          <>
            <div className="z-40 fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeNotifications} />
            <div className="z-50 fixed inset-0 flex justify-center items-start p-4 overflow-y-auto">
              <div className="relative bg-white shadow-2xl shadow-slate-900/10 border border-slate-200 rounded-4xl w-full max-w-2xl">
                <div className="flex justify-between items-start gap-4 p-5 border-slate-200 border-b">
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">Notifications</h2>
                    <p className="mt-1 text-slate-500 text-sm">Latest updates for your donor account.</p>
                  </div>
                  <button
                    onClick={closeNotifications}
                    className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 rounded-full text-slate-600 transition"
                    aria-label="Close notifications"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-5">
                  {notificationsLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="bg-slate-100 p-5 rounded-3xl animate-pulse">
                          <div className="bg-slate-200 mb-3 rounded-full w-3/5 h-4" />
                          <div className="bg-slate-200 mb-2 rounded-full w-full h-3" />
                          <div className="bg-slate-200 rounded-full w-4/5 h-3" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {notificationsError && (
                        <div className="bg-rose-50 p-4 border border-rose-200 rounded-3xl text-rose-700 text-sm">{notificationsError}</div>
                      )}
                      {notifications.length === 0 && !notificationsError ? (
                        <div className="bg-slate-50 p-8 border border-slate-200 rounded-3xl text-slate-500 text-center">No notifications yet. You will see updates here once available.</div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.map((item) => (
                            <div key={item.id} className={`rounded-3xl border p-5 transition ${item.unread ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'} shadow-sm`}>
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                                    {item.unread && <span className="bg-blue-500 px-2 py-0.5 rounded-full font-semibold text-[11px] text-white">New</span>}
                                  </div>
                                  <p className="text-slate-600 text-sm leading-relaxed">{item.message}</p>
                                </div>
                                <span className="mt-1 font-semibold text-[11px] text-slate-400 uppercase tracking-[0.15em]">{item.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
