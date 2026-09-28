import { useState, useEffect } from 'react';
import { getPaymentConfirmations } from '../../../services/authService';

export default function PaymentConfirmations({ donorID = 1 }) {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConfirmations = async () => {
      try {
        setLoading(true);
        const response = await getPaymentConfirmations(donorID);
        if (response.data && response.data.success) {
          setConfirmations(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || "Failed to load payment confirmations.");
        }
      } catch (err) {
        console.error("Error fetching payment confirmations:", err);
        setError("Unable to fetch payment confirmations. Please check database connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfirmations();
  }, [donorID]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('LKR', 'Rs.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(/-/g, "/"));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredConfirmations = confirmations.filter(item => {
    const matchesStatus = statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = item.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
      {/* ── HEADER ── */}
      <div className="space-y-1 text-left">
        <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
          Payment Confirmations
        </h1>
        <p className="font-semibold text-slate-400 text-xs md:text-sm">
          Review and track verification statuses for your submitted bank slip payments.
        </p>
      </div>

      {/* ── MAIN CARD CONTAINER ── */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden p-6 md:p-10">
        
        {/* Card Header with Filter & Search */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 relative">
          <h2 className="font-extrabold text-slate-800 text-lg md:text-xl tracking-tight">
            Bank Slip Activity
          </h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-[#f8fafc] border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Interactive Status Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                title="Filter by status"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                {statusFilter !== 'All' && (
                  <span className="ml-1.5 bg-blue-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {statusFilter}
                  </span>
                )}
              </button>

              {showFilterDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowFilterDropdown(false)} 
                  />
                  <div className="absolute right-0 mt-2 z-20 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 animate-fadeIn text-left">
                    <span className="block px-4 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Filter Status
                    </span>
                    {['All', 'Verified', 'Pending', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                          statusFilter === status ? 'text-blue-600 bg-blue-50/40' : 'text-slate-600'
                        }`}
                      >
                        {status}
                        {statusFilter === status && (
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── DATA SECTION ── */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
              <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Loading history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="inline-flex bg-red-50 p-3 rounded-full text-red-500 mb-3 border border-red-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <p className="text-red-600 text-xs font-semibold">{error}</p>
          </div>
        ) : filteredConfirmations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/40 border border-dashed border-slate-100 rounded-2xl">
            <span className="inline-flex bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            <h3 className="font-extrabold text-slate-800 text-sm">No bank slip payments found</h3>
            <p className="text-slate-400 text-xs mt-1 font-semibold max-w-xs leading-relaxed">
              {statusFilter === 'All' 
                ? "You haven't submitted any bank slip payments yet." 
                : `No bank slip payments matched the "${statusFilter}" status filter.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100/80">
                  <th className="pb-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest w-[45%]">
                    CAMPAIGN
                  </th>
                  <th className="pb-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest w-[20%]">
                    AMOUNT
                  </th>
                  <th className="pb-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest w-[20%]">
                    DATE
                  </th>
                  <th className="pb-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest w-[15%]">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredConfirmations.map((item) => (
                  <tr key={item.donationID} className="group hover:bg-slate-50/30 transition-colors duration-150">
                    {/* Campaign Title & Bank Slip Link */}
                    <td className="py-6 pr-4 font-extrabold text-slate-800 group-hover:text-blue-600 text-sm md:text-base leading-snug transition-colors duration-200">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span>{item.projectTitle}</span>
                          {item.status === 'Verified' && (
                            <span className="flex items-center text-blue-500 inline-block w-4 h-4 shrink-0" title="Verified Donation">
                              <svg className="w-4.5 h-4.5 fill-blue-50 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          Bank Slip Transfer
                          {item.slipImage && (
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/${item.slipImage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 font-bold normal-case flex items-center gap-0.5 ml-1.5 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Slip
                            </a>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-6 font-bold text-slate-800 text-sm md:text-base">
                      {formatCurrency(item.amount)}
                    </td>

                    {/* Date */}
                    <td className="py-6 text-slate-500 font-semibold text-xs md:text-sm">
                      {formatDate(item.date)}
                    </td>

                    {/* Verification Status badge */}
                    <td className="py-6">
                      {item.status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 border border-emerald-100 rounded-full font-black text-[10px] text-emerald-600 tracking-wide uppercase transition-all duration-200 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verified
                        </span>
                      ) : item.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 border border-rose-100 rounded-full font-black text-[10px] text-rose-600 tracking-wide uppercase transition-all duration-200 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 border border-slate-200 rounded-full font-black text-[10px] text-slate-500 tracking-wide uppercase transition-all duration-200 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
      </div>
    </div>
  );
}
