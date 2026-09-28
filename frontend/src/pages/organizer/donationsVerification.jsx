import { useState, useEffect } from 'react';
import Sidebar from './component/sidebar';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  FileText, 
  Eye, 
  Check, 
  X, 
  AlertCircle,
  Receipt
} from 'lucide-react';
// API services to load campaign donation slips and update slip validation status
import { getOrganizerDonations, verifyDonation } from '../../services/authService';

// ==================== Organizer Donations Verification Page ====================
export default function DonationsVerification() {
  // State for all donation records loaded from database
  const [donations, setDonations] = useState([]);
  // UI indicators for page load spinner and network errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter settings to categorize records ('All', 'Pending', 'Verified', 'Rejected')
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States to control lightbox fullscreen view and detail review overlays
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedDonationModal, setSelectedDonationModal] = useState(null);
  // actionLoading: tracks ID of row actively communicating with backend verification API
  const [actionLoading, setActionLoading] = useState(null); 
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pulls transaction records linked to organizer campaigns from the database
  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrganizerDonations();
      if (response.data && response.data.success) {
        setDonations(response.data.data);
      } else {
        setError(response.data.message || "Failed to load donations.");
      }
    } catch (err) {
      console.error("Organizer donations load error:", err);
      setError("Unable to connect to database. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Dispatches verification choice (APPROVE / REJECT) to backend database
  const handleVerify = async (donationID, isApprove) => {
    const action = isApprove ? 'APPROVE' : 'REJECT';
    setActionLoading(donationID);
    try {
      const response = await verifyDonation({ donationID, action });
      if (response.data && response.data.success) {
        setDonations(prev => prev.map(item => {
          if (item.donationID === donationID) {
            return {
              ...item,
              status: isApprove ? 'APPROVED' : 'FAILED',
              slipStatus: isApprove ? 'APPROVED' : 'REJECTED'
            };
          }
          return item;
        }));

        if (selectedDonationModal && selectedDonationModal.donationID === donationID) {
          setSelectedDonationModal(prev => prev ? {
            ...prev,
            status: isApprove ? 'APPROVED' : 'FAILED',
            slipStatus: isApprove ? 'APPROVED' : 'REJECTED'
          } : null);
        }
      } else {
        alert(response.data.message || "Action failed.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Error contacting server to complete verification.");
    } finally {
      setActionLoading(null);
    }
  };

  // Format numeric values to LKR currency standard representation (Rs. X)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('LKR', 'Rs.');
  };

  // Converts date strings to human-readable month/day/year standard formats
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(/-/g, "/"));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Computes active display records matching current search input and status category tabs
  const filteredDonations = donations.filter(item => {
    const matchesSearch = 
      item.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && item.status === 'PENDING') ||
      (statusFilter === 'Verified' && item.status === 'APPROVED') ||
      (statusFilter === 'Rejected' && item.status === 'FAILED');

    return matchesSearch && matchesStatus;
  });

  const pendingCount = donations.filter(item => item.status === 'PENDING').length;
  const approvedCount = donations.filter(item => item.status === 'APPROVED').length;
  const rejectedCount = donations.filter(item => item.status === 'FAILED').length;

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      <Sidebar
        activeTab="donations-verification"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-6 sm:space-y-8 mx-auto p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl">
          {/* Header */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-2xl sm:text-3xl md:text-4xl tracking-tight">
              Donations Verification
            </h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Review manual bank transfer receipt slips and verify campaign funding contributions.
            </p>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 sm:p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Pending Verification
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{pendingCount}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 sm:p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Verified Receipts
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{approvedCount}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 sm:p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Rejected Receipts
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{rejectedCount}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-rose-500 to-red-600 shadow-md">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
      <div className="bg-white shadow-sm border border-slate-100 rounded-[2rem] p-4 sm:p-6 md:p-8 mt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div className="flex flex-wrap bg-[#f8fafc] border border-slate-100 rounded-xl p-1 relative z-10 select-none">
                {['All', 'Pending', 'Verified', 'Rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      statusFilter === tab
                        ? 'bg-white shadow-sm border border-slate-100 text-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search donor or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-[#f8fafc] border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Loading logs...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-red-500 font-semibold text-xs bg-red-50 border border-red-100 rounded-2xl max-w-md mx-auto p-6">
                ⚠️ {error}
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/40 border border-dashed border-slate-100 rounded-2xl">
                <span className="inline-flex bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm">No transactions logs found</h3>
                <p className="text-slate-400 text-xs mt-1 font-semibold max-w-xs leading-relaxed">
                  We couldn't find any transaction matches with the chosen filter criteria.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-left font-black text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 w-[25%]">Campaign Details</th>
                      <th className="px-4 py-3 w-[25%]">Donor Details</th>
                      <th className="px-4 py-3 w-[20%]">Amount</th>
                      <th className="px-4 py-3 w-[15%]">Date</th>
                      <th className="px-4 py-3 w-[20%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 font-semibold text-sm">
                    {filteredDonations.map((item) => (
                      <tr key={item.donationID} className="align-middle hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-1">
                            <span className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-blue-600 transition-colors">
                              {item.projectTitle}
                            </span>
                            <span className="inline-block w-fit bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {item.paymentMethod}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-extrabold text-slate-800 text-sm">{item.donorName}</span>
                            <span className="text-xs text-slate-400 font-medium">{item.donorEmail}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-medium text-xs">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {item.status === 'PENDING' ? (
                            <button
                              onClick={() => setSelectedDonationModal(item)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 ml-auto active:scale-95 transition-all shadow-sm hover:shadow cursor-pointer"
                              title="Review details and approve/reject"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Review & Verify
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className={`inline-block font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                item.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>
                                {item.status === 'APPROVED' ? 'Verified' : 'Rejected'}
                              </span>
                              <button
                                onClick={() => setSelectedDonationModal(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-lg transition-colors cursor-pointer"
                                aria-label="View Donation"
                                title="View Donation"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal for detailed review before approve / reject */}
          {selectedDonationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-lg">
                      📋
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-800">
                        Review Payment & Transfer Slip
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Inspect payment receipt and donor details before verifying log.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDonationModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    selectedDonationModal.status === 'PENDING'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : selectedDonationModal.status === 'APPROVED'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-base">
                        {selectedDonationModal.status === 'PENDING' ? '⏳' : selectedDonationModal.status === 'APPROVED' ? '✅' : '❌'}
                      </span>
                      <span>
                        Status: <strong className="uppercase">{selectedDonationModal.status === 'APPROVED' ? 'Verified & Approved' : selectedDonationModal.status === 'FAILED' ? 'Rejected' : 'Pending Verification'}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/80 shadow-2xs border border-slate-200/50">
                      {selectedDonationModal.paymentMethod}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Payment Slip Image */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                        Payment Transfer Slip Receipt
                      </label>
                      {selectedDonationModal.slipImage ? (
                        <div className="relative group border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 aspect-4/3 flex items-center justify-center">
                          <img
                            src={`${import.meta.env.VITE_BACKEND_URL}/${selectedDonationModal.slipImage}`}
                            alt="Payment Slip Full Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}/${selectedDonationModal.slipImage}`)}
                              className="px-4 py-2 bg-white text-slate-800 rounded-xl font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                              </svg>
                              Enlarge Slip
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center h-48">
                          <span className="text-2xl mb-2">🌐</span>
                          <p className="text-xs font-bold text-slate-700">Direct Gateway Payment</p>
                          <p className="text-[10px] text-slate-400 mt-1">Processed automatically via payment gateway. No physical transfer slip attached.</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Key Details */}
                    <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Campaign Title</span>
                        <p className="text-xs font-extrabold text-slate-800 leading-snug mt-0.5">{selectedDonationModal.projectTitle}</p>
                      </div>

                      <div className="border-t border-slate-200/60 pt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Donor Name & Contact</span>
                        <p className="text-xs font-black text-slate-800 mt-0.5">{selectedDonationModal.donorName}</p>
                        <p className="text-[11px] font-semibold text-slate-500">{selectedDonationModal.donorEmail}</p>
                      </div>

                      <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Donated Amount</span>
                          <p className="text-base font-black text-emerald-600 mt-0.5">{formatCurrency(selectedDonationModal.amount)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Submission Date</span>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDate(selectedDonationModal.date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Sponsorship Details (If attached) */}
                  {selectedDonationModal.commercial && (
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-extrabold text-[10px] text-purple-700 uppercase tracking-wider">
                          🏢 Commercial Sponsorship Details
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                          selectedDonationModal.commercial.commStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedDonationModal.commercial.commStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          Ad Status: {selectedDonationModal.commercial.commStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-extrabold text-[10px] text-slate-400 uppercase block">Company Name</span>
                          <span className="font-extrabold text-slate-800">{selectedDonationModal.commercial.companyName}</span>
                        </div>
                        {selectedDonationModal.commercial.websiteLink && (
                          <div>
                            <span className="font-extrabold text-[10px] text-slate-400 uppercase block">Website URL</span>
                            <a
                              href={selectedDonationModal.commercial.websiteLink}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-purple-600 hover:underline truncate block"
                            >
                              {selectedDonationModal.commercial.websiteLink}
                            </a>
                          </div>
                        )}
                      </div>

                      {selectedDonationModal.commercial.adMedia && (
                        <div className="space-y-1 pt-1">
                          <span className="font-extrabold text-[10px] text-slate-400 uppercase block">Sponsorship Ad Media ({selectedDonationModal.commercial.adMediaType})</span>
                          <div className="relative rounded-xl overflow-hidden border border-purple-200 bg-slate-900 max-h-40 flex items-center justify-center">
                            {selectedDonationModal.commercial.adMediaType === 'VIDEO' ? (
                              <video
                                src={`${import.meta.env.VITE_BACKEND_URL}/${selectedDonationModal.commercial.adMedia}`}
                                controls
                                className="max-h-40 w-full object-contain"
                              />
                            ) : (
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}/${selectedDonationModal.commercial.adMedia}`}
                                alt="Sponsorship Banner"
                                className="max-h-40 w-full object-contain cursor-pointer"
                                onClick={() => setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}/${selectedDonationModal.commercial.adMedia}`)}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDonationModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  {selectedDonationModal.status === 'PENDING' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleVerify(selectedDonationModal.donationID, false)}
                        disabled={actionLoading === selectedDonationModal.donationID}
                        className="px-4 py-2.5 border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 text-red-600 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        ❌ Reject Slip
                      </button>
                      <button
                        onClick={() => handleVerify(selectedDonationModal.donationID, true)}
                        disabled={actionLoading === selectedDonationModal.donationID}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                      >
                        ✅ Approve Donation
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {lightboxImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
              <div className="relative max-w-3xl w-full flex flex-col items-center gap-4">
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="bg-white p-2 rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] w-auto flex items-center justify-center">
                  <img src={lightboxImage} alt="Enlarged Slip Receipt" className="max-h-[75vh] w-auto object-contain rounded-xl select-none" />
                </div>
                <p className="text-[10px] text-white/60 font-semibold tracking-wider uppercase">
                  Click close button or tap background to exit viewer
                </p>
              </div>
              <div className="absolute inset-0 -z-10" onClick={() => setLightboxImage(null)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
