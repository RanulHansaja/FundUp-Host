import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './component/sidebar';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  UserX,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Info,
  Sparkles
} from 'lucide-react';
import { getAdminUsers, updateUserStatus, deleteUser } from '../../services/authService';

const UserAvatar = ({ user, sizeClass = "w-10 h-10 text-xs" }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'User'}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200 shadow-xs shrink-0`}
      />
    );
  }

  let bgClass = "bg-emerald-600";
  if (user?.role === 'Admin') bgClass = "bg-purple-600";
  else if (user?.role === 'Organizer') bgClass = "bg-blue-600";

  return (
    <div className={`${sizeClass} rounded-full ${bgClass} text-white font-bold flex items-center justify-center border border-slate-200 shadow-xs shrink-0 uppercase tracking-wider select-none`}>
      {getInitials(user?.name)}
    </div>
  );
};

// Preset reasons to help admins quickly fill standard administrative actions
const PRESET_SUSPENSION_REASONS = [
  "Violation of FundUp Community & Fundraising Guidelines",
  "Suspicious activity / Pending identity investigation",
  "Inappropriate or misleading project content reported",
  "Temporary administrative restriction due to policy violations"
];

const PRESET_BLOCKING_REASONS = [
  "Fraudulent account / Forged verification documents",
  "Spamming and repeated platform violations",
  "Severe violation of platform terms of service",
  "Permanently banned by administrative order"
];

export default function UserManagement() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightUserId, setHighlightUserId] = useState(location.state?.highlightUserId || null);
  const [roleFilter, setRoleFilter] = useState(location.state?.roleFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState(''); // 'suspend' | 'activate' | 'delete' (block)
  
  // Reason input and validation for suspend/block
  const [actionReason, setActionReason] = useState('');
  const [actionReasonError, setActionReasonError] = useState('');

  // Fetch users from backend
  const fetchUsers = () => {
    setLoading(true);
    getAdminUsers()
      .then(res => {
        if (res.data && res.data.success) {
          setUsers(res.data.data);
        } else {
          console.error('Failed to load users:', res.data?.message);
        }
      })
      .catch(err => {
        console.error('Error fetching users:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.university.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || user.role.toUpperCase() === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status.toUpperCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    if (highlightUserId && filteredUsers.length > 0) {
      const index = filteredUsers.findIndex(u => u.userID === highlightUserId);
      if (index !== -1) {
        const targetPage = Math.floor(index / itemsPerPage) + 1;
        setCurrentPage(targetPage);
      }
    }
  }, [highlightUserId, filteredUsers, itemsPerPage]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Action handlers
  const handleOpenViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleOpenConfirmModal = (user, actionType) => {
    setSelectedUser(user);
    setConfirmActionType(actionType);
    setActionReason('');
    setActionReasonError('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;

    // Reason validation for suspend and block (delete)
    if (confirmActionType === 'suspend' || confirmActionType === 'delete') {
      if (!actionReason.trim()) {
        setActionReasonError('Please provide a specific reason before proceeding.');
        return;
      }
    }

    setActionLoading(true);
    setActionReasonError('');

    try {
      const targetUserID = selectedUser.userID;
      const trimmedReason = actionReason.trim();

      if (confirmActionType === 'delete') {
        const res = await deleteUser(targetUserID, trimmedReason);
        if (res.data && res.data.success) {
          setUsers(prev =>
            prev.map(u => (u.userID === targetUserID || u.id === selectedUser.id ? { ...u, status: 'Blocked', statusReason: trimmedReason } : u))
          );
          setIsConfirmModalOpen(false);
        } else {
          alert(res.data?.message || 'Failed to block user account.');
        }
      } else if (confirmActionType === 'suspend') {
        const res = await updateUserStatus(targetUserID, 'SUSPENDED', trimmedReason);
        if (res.data && res.data.success) {
          setUsers(prev =>
            prev.map(u => (u.userID === targetUserID || u.id === selectedUser.id ? { ...u, status: 'Suspended', statusReason: trimmedReason } : u))
          );
          setIsConfirmModalOpen(false);
        } else {
          alert(res.data?.message || 'Failed to suspend user account.');
        }
      } else if (confirmActionType === 'activate') {
        const res = await updateUserStatus(targetUserID, 'ACTIVE', trimmedReason);
        if (res.data && res.data.success) {
          setUsers(prev =>
            prev.map(u => (u.userID === targetUserID || u.id === selectedUser.id ? { ...u, status: 'Active', statusReason: null } : u))
          );
          setIsConfirmModalOpen(false);
        } else {
          alert(res.data?.message || 'Failed to reactivate user account.');
        }
      }
    } catch (err) {
      console.error(`Error executing ${confirmActionType}:`, err);
      alert(err.response?.data?.message || `Failed to execute ${confirmActionType} action.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper Badge Color getters
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Organizer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Donor':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Suspended':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      {/* Admin Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab="user-management"
      />

      {/* Main Content */}
      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">

          {/* Header & Title */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">User Management</h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Monitor user roles, manage verification statuses, and configure platform access permissions.
            </p>
          </div>

          {/* Filters & Control Bar */}
          <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search user, email, ID or university..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="DONOR">Donor</option>
                  <option value="ORGANIZER">Organizer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* User List Render (Table vs Grid) */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-600">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <UserX className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-bold text-slate-700">No Users Found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search filters or clearing search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">User Details</th>
                      <th className="py-4 px-4">Role</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Affiliation / Org</th>
                      <th className="py-4 px-4">Joined Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className={`transition ${user.userID === highlightUserId ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-slate-50/60'}`}>
                        {/* User Profile Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} sizeClass="w-10 h-10 text-xs" />
                            <div className="truncate max-w-[200px]">
                              <div className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer flex items-center gap-1.5" onClick={() => handleOpenViewModal(user)}>
                                <span>{user.name}</span>
                              </div>
                              <div className="text-xs text-slate-400 truncate">{user.email}</div>
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(user.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : user.status === 'Suspended' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                              {user.status}
                            </span>
                            {user.statusReason && (user.status === 'Suspended' || user.status === 'Blocked') && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[160px]" title={`Reason: ${user.statusReason}`}>
                                <Info size={11} className="text-amber-500 shrink-0" />
                                <span className="truncate italic">{user.statusReason}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* University / Affiliation */}
                        <td className="py-4 px-4 text-xs text-slate-600">
                          <div className="font-semibold text-slate-700 truncate max-w-[180px]">{user.university}</div>
                          <div className="text-slate-400 text-[11px] truncate max-w-[180px]">{user.department !== 'N/A' ? user.department : ''}</div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                          {user.joinedDate}
                        </td>

                        {/* Action Buttons */}
                        {/* Action Buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenViewModal(user)}
                              className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Suspend / Reactivate Button */}
                            {user.status === 'Blocked' ? (
                              <button
                                disabled
                                className="p-2 rounded-xl bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60"
                                title="Account is Blocked"
                              >
                                <Ban size={16} />
                              </button>
                            ) : user.status === 'Suspended' ? (
                              <button
                                onClick={() => handleOpenConfirmModal(user, 'activate')}
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Reactivate User"
                              >
                                <CheckCircle size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenConfirmModal(user, 'suspend')}
                                className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 hover:bg-amber-500 hover:text-white hover:border-amber-500 hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Suspend User Access"
                              >
                                <Ban size={16} />
                              </button>
                            )}

                            {/* Block / Delete Button */}
                            <button
                              onClick={() => handleOpenConfirmModal(user, 'delete')}
                              disabled={user.status === 'Blocked'}
                              className={`p-2 rounded-xl transition-all ${
                                user.status === 'Blocked'
                                  ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60'
                                  : 'bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-sm active:scale-95 cursor-pointer'
                              }`}
                              title={user.status === 'Blocked' ? 'Account Already Blocked' : 'Block User Account'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {paginatedUsers.map((user) => (
                <div key={user.id} className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between ${user.userID === highlightUserId ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200/80'}`}>
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} sizeClass="w-12 h-12 text-sm" />
                        <div>
                          <h4 className="font-bold text-slate-900 leading-tight">{user.name}</h4>
                          <span className="text-xs text-slate-400">{user.email}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(user.status)}`}>
                        {user.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Role:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${getRoleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Institution:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[160px]">{user.university}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Joined:</span>
                        <span className="font-mono text-slate-600">{user.joinedDate}</span>
                      </div>
                      {user.statusReason && (user.status === 'Suspended' || user.status === 'Blocked') && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Reason:</span>
                          <span className="text-amber-700 font-medium text-[11px] line-clamp-2 mt-0.5">{user.statusReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenViewModal(user)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                    >
                      View Profile →
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Suspend / Reactivate Button */}
                      {user.status === 'Blocked' ? (
                        <button
                          disabled
                          className="p-1.5 rounded-xl bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60"
                          title="Account is Blocked"
                        >
                          <Ban size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenConfirmModal(user, user.status === 'Suspended' ? 'activate' : 'suspend')}
                          className={`p-1.5 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                            user.status === 'Suspended'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                              : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white'
                          }`}
                          title={user.status === 'Suspended' ? 'Reactivate User' : 'Suspend User'}
                        >
                          {user.status === 'Suspended' ? <CheckCircle size={15} /> : <Ban size={15} />}
                        </button>
                      )}

                      {/* Block Button */}
                      <button
                        onClick={() => handleOpenConfirmModal(user, 'delete')}
                        disabled={user.status === 'Blocked'}
                        className={`p-1.5 rounded-xl transition-all ${
                          user.status === 'Blocked'
                            ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer active:scale-95'
                        }`}
                        title={user.status === 'Blocked' ? 'Account Already Blocked' : 'Block User'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Component */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}</span> to{' '}
                <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                <span className="font-bold text-slate-800">{filteredUsers.length}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: VIEW USER DETAILS MODAL */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                <UserAvatar user={selectedUser} sizeClass="w-16 h-16 text-xl border-2 border-white/80 shadow-md" />
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-blue-100 text-xs">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* If Suspended or Blocked with Reason, show Alert Banner */}
              {(selectedUser.status === 'Suspended' || selectedUser.status === 'Blocked') && selectedUser.statusReason && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${selectedUser.status === 'Blocked' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <ShieldAlert size={20} className={`shrink-0 mt-0.5 ${selectedUser.status === 'Blocked' ? 'text-rose-600' : 'text-amber-600'}`} />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {selectedUser.status} Status Notice
                    </p>
                    <p className="text-xs leading-relaxed">
                      <span className="font-semibold">Reason: </span>
                      {selectedUser.statusReason}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">User ID</p>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Phone Number</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Institution / Org</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedUser.university}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Joined Date</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedUser.joinedDate}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">User Bio & Details</p>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedUser.bio || 'No bio provided for this user account.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 text-center">
                  <span className="text-xs text-slate-500 font-medium">Projects Authored</span>
                  <p className="text-lg font-bold text-blue-700 mt-0.5">{selectedUser.projectsCount}</p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-center">
                  <span className="text-xs text-slate-500 font-medium">Total Donated</span>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{selectedUser.totalDonations}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM ACTION MODAL (Suspend / Activate / Block with Mandatory Reason) */}
      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-left border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${confirmActionType === 'delete' ? 'bg-rose-100 text-rose-600' : confirmActionType === 'suspend' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {confirmActionType === 'delete' ? <Trash2 size={24} /> : confirmActionType === 'suspend' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmActionType === 'delete' ? 'Block & Deactivate Account' : confirmActionType === 'suspend' ? 'Suspend User Access' : 'Reactivate User Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  Target Account: <span className="font-semibold text-slate-800">{selectedUser.name}</span> ({selectedUser.email})
                </p>
              </div>
            </div>

            {/* Action Explanation */}
            <div className="mb-4 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
              {confirmActionType === 'delete' ? (
                <>
                  <span className="font-bold text-rose-600">Warning:</span> Blocking will permanently deny this user access to log in or create projects. Historical transactions and projects are preserved in the system.
                </>
              ) : confirmActionType === 'suspend' ? (
                <>
                  <span className="font-bold text-amber-600">Notice:</span> Suspending this account will temporarily disable user login and pause their active campaigns until reactivated.
                </>
              ) : (
                <>
                  <span className="font-bold text-emerald-600">Confirmation:</span> Reactivating this account will restore standard login access and permit active platform operations.
                </>
              )}
            </div>

            {/* Reason Field for Suspend / Block */}
            {(confirmActionType === 'suspend' || confirmActionType === 'delete') && (
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Reason for {confirmActionType === 'delete' ? 'Blocking' : 'Suspension'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{actionReason.length}/250 chars</span>
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-blue-500" />
                    Quick Selection:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(confirmActionType === 'delete' ? PRESET_BLOCKING_REASONS : PRESET_SUSPENSION_REASONS).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActionReason(preset);
                          setActionReasonError('');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition cursor-pointer ${
                          actionReason === preset
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Textarea */}
                <div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder={`Enter detailed reason for ${confirmActionType === 'delete' ? 'blocking' : 'suspending'} this user (will be logged in moderation records and notified to user)...`}
                    value={actionReason}
                    onChange={(e) => {
                      setActionReason(e.target.value);
                      if (actionReasonError) setActionReasonError('');
                    }}
                    className={`w-full text-xs p-3 rounded-xl border bg-white focus:outline-none transition resize-none ${
                      actionReasonError
                        ? 'border-rose-400 ring-2 ring-rose-100'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                  {actionReasonError && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {actionReasonError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Optional note for Reactivation */}
            {confirmActionType === 'activate' && (
              <div className="space-y-2 mb-5">
                <label className="text-xs font-bold text-slate-700">
                  Reactivation Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  placeholder="Optional notes regarding the account reactivation..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setActionReason('');
                  setActionReasonError('');
                }}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  confirmActionType === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : confirmActionType === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {actionLoading && <Loader2 className="animate-spin" size={14} />}
                {confirmActionType === 'delete'
                  ? 'Confirm & Block User'
                  : confirmActionType === 'suspend'
                  ? 'Confirm & Suspend User'
                  : 'Reactivate Account'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
