import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// API integrations to log out and retrieve/update notification reads
import {
  logout as apiLogout,
  getOrganizerNotifications,
  markOrganizerNotificationsRead
} from '../../../services/authService';
// useAuth: Context custom hook to access global logged-in session metrics
import { useAuth } from '../../../context/AuthContext';

// ==================== Organizer Navigation Sidebar Component ====================
const Sidebar = ({
  activeTab = null,
  setActiveTab = () => { },
  onLogout = () => { },
  onNotificationsClick = () => { },
  sidebarOpen = false,
  setSidebarOpen = () => { },
  user = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || '';
  
  // States to track mobile view menu open and logout overlay visibility
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isSidebarOpen = typeof sidebarOpen === 'boolean' ? sidebarOpen : internalSidebarOpen;

  const setMenuOpen = (value) => {
    if (typeof setSidebarOpen === 'function') {
      setSidebarOpen(value);
    }
    setInternalSidebarOpen(value);
  };
  const { currentUser, logout: contextLogout } = useAuth();
  
  // Merges user state parameters from props and Auth context variables
  const resolvedUser = {
    ...user,
    name: currentUser?.fullName || user?.name || 'User',
    email: currentUser?.email || user?.email || 'user@domain.com'
  };
  // Infers the active navigation tab based on window path name match patterns
  const inferredActiveTab = pathname.includes('/organizer/create-project')
    ? 'create project'
    : pathname.includes('/organizer/my-project')
      ? 'my-projects'
      : pathname.includes('/organizer/donations-verification')
        ? 'donations-verification'
        : pathname.includes('/organizer/settings')
          ? 'settings'
          : pathname.includes('/organizer-dashboard') && activeTab !== null
            ? activeTab
            : 'dashboard';
  const currentTab = activeTab || inferredActiveTab;

  // States to manage unseen notifications and popup visibility
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);

  // Pulls recent notifications from the API and calculates the count of unread entries
  const loadNotifications = async () => {
    try {
      setNotificationsError(null);
      const response = await getOrganizerNotifications();
      if (response.data?.success) {
        const list = response.data.data?.notifications || [];
        setNotifications(list);
        const unreadCount = list.filter((item) => item.unread).length;
        setUnseenCount(unreadCount);
      } else {
        setNotificationsError(response.data?.message || 'Unable to load notifications.');
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setNotificationsError('Unable to load notifications.');
    }
  };

  // Shows notifications list and hits endpoint to mark all as read
  const openNotifications = async () => {
    setShowNotificationsPopup(true);
    setNotificationsLoading(true);
    await loadNotifications();
    try {
      const markResponse = await markOrganizerNotificationsRead();
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

  const closeNotifications = () => {
    setShowNotificationsPopup(false);
  };

  const handleNotificationsClick = () => {
    if (showNotificationsPopup) {
      closeNotifications();
      return;
    }
    openNotifications();
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Menu configuration mapping navigation tabs to visual text and icon objects
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
      id: 'my-projects',
      label: 'My Projects',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7a2 2 0 012-2h2l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
        </svg>
      ),
    },
    {
      id: 'donations-verification',
      label: 'Donations Verification',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'create project',
      label: 'Create Project',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          <circle cx="12" cy="12" r="9" fill="none" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Displays logout confirmation overlay modal
  const handleLogoutAction = () => {
    setShowLogoutModal(true);
  };

  // Executes session teardown and redirects to login route page
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-[90%] mx-auto animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-50 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Message */}
            <h2 className="text-xl font-bold text-center text-slate-900 mb-2">
              Confirm Logout
            </h2>
            <p className="text-center text-slate-600 text-sm mb-6">
              Are you sure you want to logout? You'll need to log in again to access the organizer dashboard.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 active:scale-95"
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
          className="md:hidden fixed top-4 right-4 z-40 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Open Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-slate-900/40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-30 w-72 border-r
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        bg-white border-slate-100 text-slate-800
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* ── TOP SECTION ── */}
        <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1 min-h-0">
          {/* Mobile close button */}
          <div className="md:hidden flex justify-end">
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              aria-label="Close Sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Card */}
          <div className="relative flex flex-col items-center text-center p-5 rounded-2xl border bg-slate-50/70 border-slate-100/80">
            <button
              onClick={handleNotificationsClick}
              className="absolute top-4 right-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl p-2 text-slate-500 hover:text-slate-800 shadow-sm transition-all duration-200"
              title="Notifications"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black leading-5 text-white flex items-center justify-center animate-pulse shadow-lg border border-white">
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </button>

            <div className="relative group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm shrink-0 cursor-pointer hover:border-blue-600 transition-colors duration-200 bg-orange-100 flex items-center justify-center">
                {currentUser?.profilePhoto && !imgError ? (
                  <img
                    src={currentUser.profilePhoto.startsWith('http')
                      ? currentUser.profilePhoto
                      : `${(import.meta.env.VITE_BACKEND_URL || 'https://fundup-backend-cbfbh7d5gtdscxgg.southafricanorth-01.azurewebsites.net').replace(/\/+$/, '')}/${currentUser.profilePhoto.replace(/^\/+/, '')}`}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#fca5a5] flex items-center justify-center text-white font-bold text-2xl uppercase">
                    {(user?.name || currentUser?.fullName || 'User').substring(0, 2)}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            </div>

            <div className="mt-3">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Welcome back,</span>
              <h4 className="text-sm font-extrabold tracking-tight mt-0.5 text-slate-800">{resolvedUser.name}</h4>
              <span className="block text-[10px] font-semibold truncate max-w-[200px] mt-0.5 text-slate-400">{resolvedUser.email}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                item.id === 'dashboard'
                  ? currentTab === 'dashboard'
                  : item.id === 'my-projects'
                    ? currentTab === 'my-projects'
                    : item.id === 'donations-verification'
                      ? currentTab === 'donations-verification'
                      : item.id === 'create project'
                        ? currentTab === 'create project'
                        : item.id === 'settings'
                          ? currentTab === 'settings'
                          : false;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'create project') {
                      navigate('/organizer/create-project');
                    } else if (item.id === 'dashboard') {
                      navigate('/organizer-dashboard');
                      setActiveTab('dashboard');
                    } else if (item.id === 'donations-verification') {
                      navigate('/organizer/donations-verification');
                      setActiveTab('donations-verification');
                    } else if (item.id === 'settings') {
                      navigate('/organizer/settings');
                      setActiveTab('settings');
                    } else if (item.id === 'my-projects') {
                      navigate('/organizer/my-project');
                      setActiveTab('my-projects');
                    }
                    setMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
                    transition-all duration-200
                    ${isActive
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500 pl-2.5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
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
        <div className="p-6 border-t shrink-0 border-slate-100">
          <button
            onClick={handleLogoutAction}
            className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-full shadow-md active:scale-[0.98] transition-all duration-200 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/60"
          >
            Log out
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        {showNotificationsPopup && (
          <>
            <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={closeNotifications} />
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl rounded-[2rem] bg-white border border-slate-200 shadow-2xl shadow-slate-900/10">
                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                    <p className="text-sm text-slate-500 mt-1">Latest updates for your organizer account.</p>
                  </div>
                  <button
                    onClick={closeNotifications}
                    className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition"
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
                        <div key={index} className="animate-pulse rounded-3xl bg-slate-100 p-5">
                          <div className="h-4 w-3/5 rounded-full bg-slate-200 mb-3" />
                          <div className="h-3 w-full rounded-full bg-slate-200 mb-2" />
                          <div className="h-3 w-4/5 rounded-full bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {notificationsError && (
                        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          {notificationsError}
                        </div>
                      )}
                      {notifications.length === 0 && !notificationsError ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                          No notifications yet. You will see updates here once available.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.map((item) => (
                            <div
                              key={item.id}
                              className={`rounded-3xl border p-5 transition ${item.unread ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'} shadow-sm`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                                    {item.unread && (
                                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 mt-1">{item.time}</span>
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
