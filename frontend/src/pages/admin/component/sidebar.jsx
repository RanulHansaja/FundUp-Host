import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminNotifications, markAdminNotificationsRead, logout as apiLogout } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
// import { Link } from 'react-router-dom';
// import logoImg from '../../../assets/images/FundUp logo-CRF5i8gW.png';
const Sidebar = ({
    activeTab = 'dashboard',
    setActiveTab = () => { },
    sidebarOpen = false,
    setSidebarOpen = () => { },
    user = { name: 'Admin', role: 'admin', email: 'admin@fundup.com', badgeLevel: 'NONE' },
}) => {
    const navigate = useNavigate();
    const { currentUser, logout: contextLogout } = useAuth();
    const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unseenCount, setUnseenCount] = useState(0);
    const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState(null);
    const isSidebarOpen = typeof sidebarOpen === 'boolean' ? sidebarOpen : internalSidebarOpen;

    const setMenuOpen = (value) => {
        if (typeof setSidebarOpen === 'function') {
            setSidebarOpen(value);
        }
        setInternalSidebarOpen(value);
    };

    // Fallback to prop user if currentUser is not yet loaded, though currentUser should be main source of truth
    const sidebarUser = {
        ...user,
        name: currentUser?.fullName || user.name,
        email: currentUser?.email || user.email,
        profilePhoto: currentUser?.profilePhoto || null
    };

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
            id: 'organizer-approvals',
            label: 'Organizer Approvals',
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M4 7h16M4 12h8m-8 5h10" />
                </svg>
            ),
        },
        {
            id: 'project-moderations',
            label: 'Reported Projects',
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12M6 20h12M6 16h12M6 8h12M10 12h4" />
                </svg>
            ),
        },
        {
            id: 'user-management',
            label: 'User Management',
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-3M9 20H4v-2a4 4 0 014-4h1m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
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

    const loadNotifications = async () => {
        try {
            setNotificationsError(null);
            const response = await getAdminNotifications();
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
            const markResponse = await markAdminNotificationsRead();
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
        const initializeNotifications = async () => {
            await loadNotifications();
        };
        initializeNotifications();
    }, []);

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
                            Are you sure you want to logout? You'll need to log in again to access the admin dashboard.
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
                        {/* Notifications */}
                        <button
                            onClick={handleNotificationsClick}
                            className="top-3 right-3 absolute bg-white hover:bg-slate-50 shadow-sm p-1.5 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
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

                        <div className="group relative">
                            <div className="shadow-sm border-2 border-blue-500 hover:border-blue-600 rounded-full w-16 h-16 overflow-hidden transition-colors duration-200 cursor-pointer shrink-0 bg-orange-100 flex items-center justify-center">
                                {sidebarUser.profilePhoto ? (
                                    <img
                                        src={`${import.meta.env.VITE_BACKEND_URL}/${sidebarUser.profilePhoto}`}
                                        alt="User avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#fca5a5] flex items-center justify-center text-white font-bold text-2xl uppercase">
                                        {sidebarUser.name.substring(0, 2)}
                                    </div>
                                )}
                            </div>
                            <span className="right-0 bottom-0 absolute bg-green-500 border-2 border-white rounded-full w-3.5 h-3.5" />
                        </div>

                        <div className="flex flex-col items-center mt-3">
                            <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Welcome back,</span>
                            <h4 className="mt-0.5 font-extrabold text-slate-800 text-sm tracking-tight">{sidebarUser?.name || 'User'}</h4>
                            {sidebarUser?.badgeLevel && sidebarUser?.badgeLevel !== 'NONE' && sidebarUser?.badgeLevel !== 'Loading...' && (
                                <span className="inline-block bg-indigo-50 mt-1.5 px-2.5 py-0.5 border border-indigo-100 rounded-full font-extrabold text-[9px] text-indigo-600 uppercase tracking-wider">
                                    {sidebarUser.badgeLevel} Contributor
                                </span>
                            )}
                            <span className="block mt-2 max-w-[200px] font-semibold text-[10px] text-slate-400 truncate">{sidebarUser?.email || 'user@domain.com'}</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (item.id === 'browse') {
                                            window.location.href = '/projects';
                                        } else if (item.id === 'settings') {
                                            navigate('/admin/settings');
                                            setActiveTab('settings');
                                        } else if (item.id === 'dashboard') {
                                            navigate('/admin-dashboard');
                                            setActiveTab('dashboard');
                                        } else if (item.id === 'organizer-approvals') {
                                            navigate('/admin/organizer-approvals');
                                            setActiveTab('organizer-approvals');
                                        } else if (item.id === 'user-management') {
                                            navigate('/admin/user-management');
                                            setActiveTab('user-management');
                                        } else if (item.id === 'project-moderations') {
                                            navigate('/admin/project-moderation');
                                            setActiveTab('project-moderations');
                                        } else {
                                            setActiveTab(item.id);
                                        }
                                        setMenuOpen(false); // auto-close on mobile after selection
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
                {/* Notifications Popup */}
                {showNotificationsPopup && (
                    <>
                        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={closeNotifications} />
                        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                            <div className="relative w-full max-w-2xl rounded-[2rem] bg-white border border-slate-200 shadow-2xl shadow-slate-900/10">
                                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                                        <p className="text-sm text-slate-500 mt-1">Latest updates for your admin account.</p>
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
