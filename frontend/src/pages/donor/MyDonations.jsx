import { useState, useEffect } from 'react';
import { getMyDonations, getCompletedDonationsBreakdown, getPendingDonations, getDonationDetails, downloadReceipt } from '../../services/authService';

function MyDonations() {
  const [data, setData] = useState({
    stats: {
      totalDonated: 0,
      projectsImpacted: 0,
      pendingVerifications: 0
    },
    donations: [],
    pagination: { page: 1, limit: 10, totalRows: 0, totalPages: 1 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [page, setPage] = useState(1);
  const [year, setYear] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Modal States
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [completedData, setCompletedData] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = ['All', currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()];
  const statuses = ['All', 'Completed', 'Processing', 'Failed'];

  const fetchData = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      setError(null);
      const response = await getMyDonations({ page, limit: 10, year, status, search });
      if (response.data && response.data.success) {
        if (isLoadMore) {
          setData(prev => ({
            ...response.data.data,
            donations: [...prev.donations, ...response.data.data.donations]
          }));
        } else {
          console.log("API Response (donations):", response.data.data.donations);
          setData(response.data.data);
        }
      } else {
        setError(response.data?.message || 'Failed to fetch donations.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, status]); 
  
  useEffect(() => {
    setPage(1);
    const handler = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);
  
  useEffect(() => {
    if (page > 1) {
      fetchData(true);
    }
  }, [page]);

  const handleDownloadTaxReceipt = () => {
    const completed = data.donations.filter(d => d.paymentStatus === 'APPROVED');
    if (completed.length === 0) {
      alert("No completed donations available for tax receipt.");
      return;
    }
    
    const headers = ['Project Name', 'Department', 'University', 'Date', 'Amount (Rs)', 'Status'];
    const rows = completed.map(d => [
      `"${d.projectName}"`, 
      `"${d.department}"`, 
      `"${d.university}"`, 
      d.date, 
      d.amount, 
      d.paymentStatus
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Tax_Receipt_FundUp.csv");
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('LKR', 'Rs.');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // --- Modal Fetch Handlers ---

  const handleOpenCompletedBreakdown = async () => {
    setIsCompletedModalOpen(true);
    setModalLoading(true);
    try {
      const res = await getCompletedDonationsBreakdown();
      if (res.data && res.data.success) {
        setCompletedData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenPendingTransactions = async () => {
    setIsPendingModalOpen(true);
    setModalLoading(true);
    try {
      const res = await getPendingDonations();
      if (res.data && res.data.success) {
        setPendingData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRefreshPending = async () => {
    setModalLoading(true);
    try {
      const res = await getPendingDonations();
      if (res.data && res.data.success) {
        setPendingData(res.data.data);
        // Also refresh background stats
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDetails = async (donationID) => {
    setIsDetailsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await getDonationDetails(donationID);
      if (res.data && res.data.success) {
        setDetailsData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadIndividualReceipt = async (donationID) => {
    setIsDownloadingReceipt(true);
    try {
      const res = await downloadReceipt(donationID);
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FundUp_Receipt_${donationID}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download receipt", err);
      alert("Could not download receipt. Please try again.");
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  // --- Modal Components ---

  const ModalWrapper = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-extrabold text-lg text-slate-800">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl w-full relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1 text-left">
          <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
            My Donations
          </h1>
          <p className="font-semibold text-slate-400 text-xs md:text-sm">
            Track your financial contributions, project impact, and tax receipts.
          </p>
        </div>
        <button 
          onClick={handleDownloadTaxReceipt}
          className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Tax Receipt
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-xs uppercase tracking-wider">Total Donated</span>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-blue-600 mb-1">
              {formatCurrency(data.stats.totalDonated)}
            </div>
            <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Calculated from completed donations
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="font-bold text-xs uppercase tracking-wider">Projects Impacted</span>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-800 mb-1">
              {data.stats.projectsImpacted}
            </div>
            <div className="text-xs font-semibold text-slate-400">
              Across various departments
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-xs uppercase tracking-wider">Pending Verifications</span>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-800 mb-1">
              {data.stats.pendingVerifications}
            </div>
            <div 
              onClick={handleOpenPendingTransactions}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer w-max"
            >
              View pending transactions
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="font-extrabold text-slate-800 text-lg md:text-xl tracking-tight">Donation History</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-9 pr-4 py-2 bg-[#f8fafc] border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-[#f8fafc] border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
            <select 
              className="px-3 py-2 bg-[#f8fafc] border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
            </select>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center text-sm font-semibold">
            {error}
          </div>
        ) : loading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-50 rounded w-1/4"></div>
                </div>
                <div className="w-24 h-6 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : data.donations.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No donations found</h3>
            <p className="text-sm text-slate-500 mb-6">You haven't made any donations matching the current filters.</p>
            <button 
              onClick={() => { setYear('All'); setStatus('All'); setSearch(''); }}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.donations.map((donation) => {
              const isCompleted = donation.paymentStatus === 'APPROVED';
              const isPending = donation.paymentStatus === 'PENDING';
              
              return (
                <div key={donation.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug">{donation.projectName}</h3>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">{donation.department}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                      {donation.paymentMethod}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-8 ml-auto">
                    <div className="flex flex-col items-end hidden md:flex w-32">
                      <span className="font-bold text-slate-700">{formatDate(donation.date)}</span>
                      <span className={`text-xs font-bold flex items-center gap-1 ${isCompleted ? 'text-emerald-500' : isPending ? 'text-amber-500' : 'text-red-500'}`}>
                        {isCompleted && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        {isPending && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                        {isCompleted ? 'Completed' : isPending ? 'Processing' : 'Failed'}
                      </span>
                    </div>
                    
                    <div className="w-32 text-right">
                      <div className="font-extrabold text-blue-600 text-xl tabular-nums">{formatCurrency(donation.amount)}</div>
                    </div>

                    <div className="w-32 text-right shrink-0">
                      <button 
                        onClick={() => handleOpenDetails(donation.id)}
                        className="hidden sm:block px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors active:scale-95 ml-auto"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center w-full md:hidden pt-2 border-t border-slate-100">
                     <span className="font-bold text-slate-600 text-sm">{formatDate(donation.date)}</span>
                     <button 
                        onClick={() => handleOpenDetails(donation.id)}
                        className="text-xs font-bold text-blue-600 underline"
                     >
                       Details
                     </button>
                     <span className={`text-xs font-bold flex items-center gap-1 ${isCompleted ? 'text-emerald-500' : isPending ? 'text-amber-500' : 'text-red-500'}`}>
                        {isCompleted && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        {isCompleted ? 'Completed' : isPending ? 'Processing' : 'Failed'}
                      </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data.pagination.page < data.pagination.totalPages && !loading && (
          <div className="flex justify-center pt-4">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              Load More Donations
            </button>
          </div>
        )}
        
        {loading && page > 1 && (
           <div className="flex justify-center pt-4">
              <div className="border-2 border-blue-500 border-t-transparent rounded-full w-6 h-6 animate-spin"></div>
           </div>
        )}
      </div>

      {/* ---------------- MODALS ---------------- */}
      
      {/* 1. Completed Breakdown Modal */}
      <ModalWrapper isOpen={isCompletedModalOpen} onClose={() => setIsCompletedModalOpen(false)} title="Donation Breakdown">
        {modalLoading ? (
          <div className="flex justify-center py-10"><div className="border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div></div>
        ) : completedData && completedData.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm font-semibold flex items-center justify-between">
               <span>Total Accumulated</span>
               <span className="text-xl font-extrabold">{formatCurrency(completedData[0].runningTotal)}</span>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Project / Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment Info</th>
                    <th className="px-4 py-3 text-right">Running Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {completedData.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{c.projectName}</div>
                        <div className="text-xs">{formatDate(c.date)}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">+{formatCurrency(c.amount)}</td>
                      <td className="px-4 py-3 text-xs">
                        <div><span className="font-semibold text-slate-700">{c.paymentMethod}</span></div>
                        <div className="text-slate-400">TXN: {c.transactionID}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(c.runningTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-6">No completed donations found.</p>
        )}
      </ModalWrapper>

      {/* 2. Pending Transactions Modal */}
      <ModalWrapper isOpen={isPendingModalOpen} onClose={() => setIsPendingModalOpen(false)} title="Pending Transactions">
        <div className="flex justify-end mb-4">
           <button onClick={handleRefreshPending} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
             <svg className={`w-4 h-4 ${modalLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             Refresh
           </button>
        </div>
        {modalLoading && !pendingData ? (
          <div className="flex justify-center py-10"><div className="border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div></div>
        ) : pendingData && pendingData.length > 0 ? (
          <div className="space-y-4">
            {pendingData.map(p => (
              <div key={p.id} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row gap-4 justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-slate-800">{p.projectName}</h4>
                  <div className="text-sm text-slate-500 mt-1 flex flex-col gap-1">
                    <span>Date: <span className="font-semibold text-slate-700">{formatDate(p.date)}</span></span>
                    <span>Method: <span className="font-semibold text-slate-700">{p.paymentMethod}</span></span>
                    <span>Admin Notes: <span className="italic text-slate-600">{p.adminNotes}</span></span>
                  </div>
                </div>
                <div className="text-right w-full md:w-auto bg-white p-3 rounded-lg border border-amber-100">
                   <div className="text-lg font-extrabold text-slate-900 mb-2">{formatCurrency(p.amount)}</div>
                   <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Status: {p.paymentStatus}</span>
                      <span className="text-slate-500">Verification: {p.verificationStatus}</span>
                      <span className="text-blue-600 mt-1">Expected: {p.expectedProcessing}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-6">You have no pending transactions.</p>
        )}
      </ModalWrapper>

      {/* 3. Donation Details Modal */}
      <ModalWrapper isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Donation Details">
        {modalLoading ? (
          <div className="flex justify-center py-10"><div className="border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div></div>
        ) : detailsData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
               <div>
                 <h2 className="text-xl font-extrabold text-slate-900">{detailsData.projectInfo}</h2>
                 <p className="text-sm font-semibold text-slate-500 mt-1">{detailsData.department}, {detailsData.university}</p>
                 <p className="text-xs text-slate-400 mt-1">{detailsData.organizerDetails}</p>
               </div>
               <div className="text-right bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Amount</span>
                  <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(detailsData.amount)}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Date & Time</span>
                  <span className="text-sm font-semibold text-slate-800">{new Date(detailsData.date).toLocaleString()}</span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Payment Method</span>
                  <span className="text-sm font-semibold text-slate-800">{detailsData.paymentMethod}</span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Transaction ID</span>
                  <span className="text-sm font-mono font-semibold text-slate-700">{detailsData.transactionID}</span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Payment Status</span>
                  <span className={`text-sm font-bold ${detailsData.paymentStatus === 'APPROVED' ? 'text-emerald-600' : detailsData.paymentStatus === 'PENDING' ? 'text-amber-600' : 'text-red-600'}`}>
                    {detailsData.paymentStatus}
                  </span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Verification</span>
                  <span className="text-sm font-semibold text-slate-800">{detailsData.verificationStatus}</span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Message</span>
                  <span className="text-sm font-semibold italic text-slate-500">{detailsData.donationMessage}</span>
               </div>
            </div>

            <div>
               <h4 className="text-sm font-bold text-slate-700 mb-2">Campaign Progress at Donation</h4>
               <div className="w-full bg-slate-100 rounded-full h-3 mb-1">
                 <div className="bg-blue-600 h-3 rounded-full" style={{ width: detailsData.campaignProgress }}></div>
               </div>
               <div className="text-xs font-semibold text-slate-500 text-right">{detailsData.campaignProgress} Funded</div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
               <span className="text-sm font-semibold text-slate-600">Tax Receipt: {detailsData.taxReceiptAvailability}</span>
               {detailsData.taxReceiptAvailability === 'Available' && (
                  <button 
                    onClick={() => handleDownloadIndividualReceipt(detailsData.id)}
                    disabled={isDownloadingReceipt}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDownloadingReceipt ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center gap-2`}
                  >
                    {isDownloadingReceipt && <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
                    {isDownloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                  </button>
               )}
            </div>
          </div>
        ) : (
           <p className="text-center text-red-500 py-6">Could not load details.</p>
        )}
      </ModalWrapper>

    </div>
  );
}

export default MyDonations;
