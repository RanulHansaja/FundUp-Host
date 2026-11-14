import { useEffect, useState } from 'react'
import Sidebar from "./component/sidebar";
import { getOrganizerApprovals } from '../../services/authService'
import ReviewModal from './component/reviewModal'

function timeAgo(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const sec = Math.floor((now - d) / 1000)
    if (sec < 60) return `Submitted ${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `Submitted ${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `Submitted ${hr}h ago`
    const days = Math.floor(hr / 24)
    return `Submitted ${days}d ago`
}

function OrganizerApprovals() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = { name: 'Admin User', role: 'admin', email: 'admin@fundup.com' };
    const [selectedID, setSelectedID] = useState(null)

    useEffect(() => {
        let mounted = true
        getOrganizerApprovals()
            .then(res => {
                if (!mounted) return
                if (res.data && res.data.success) {
                    const mapped = res.data.data.map(item => {
                        const name = item.fullName || item.organizationName || 'Unknown'
                        const parts = (item.fullName || '').split(' ')
                        const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]) : (parts[0]?.slice(0, 2) || 'NA')
                        const docs = (item.approvalLetterPath ? 1 : 0) + (item.studentIdPath ? 1 : 0)
                        const domainConfirmed = (item.verificationStatus === 'VERIFIED')
                        const highlight = !domainConfirmed
                        const submitted = item.submittedDate ? timeAgo(item.submittedDate) : ''

                        return {
                            verificationID: item.verificationID,
                            organizerID: item.organizerID,
                            userID: item.userID,
                            initials,
                            name,
                            submitted,
                            institution: item.universityName || item.organizationName,
                            dept: '',
                            domainConfirmed,
                            docs,
                            highlight,
                            raw: item
                        }
                    })
                    setRows(mapped)
                }
            })
            .catch(err => {
                console.error('Failed to fetch organizer approvals', err)
            })
            .finally(() => setLoading(false))

        return () => { mounted = false }
    }, [])

    return (
        <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
            <Sidebar
                activeTab="organizer-approvals"
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
            />

            <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
                <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
                    {/* ── HEADER ── */}
                    <div className="space-y-1 text-left">
                        <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
                            Organizer Approvals
                        </h1>
                        <p className="font-semibold text-slate-400 text-xs md:text-sm">
                            Review and verify new organizer registrations to ensure institutional trust.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

                                <div>
                                    <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                                        <div className="col-span-4">ORGANIZER</div>
                                        <div className="col-span-3">INSTITUTION/DEPT</div>
                                        <div className="col-span-3">VERIFICATION</div>
                                        <div className="col-span-2 text-right pr-2">ACTIONS</div>
                                    </div>

                                    <div>
                                        {loading ? (
                                            <div className="p-8 text-center text-slate-400 font-semibold text-xs">Loading pending approvals...</div>
                                        ) : (
                                            rows.map((r, idx) => (
                                                <div key={r.verificationID || idx} className={`${r.highlight ? 'bg-rose-50/40' : 'hover:bg-slate-50/40'} grid grid-cols-12 gap-4 items-center px-6 py-5 border-b border-slate-100 last:border-b-0 transition-colors duration-150`}>
                                                    <div className="col-span-4 flex items-center space-x-4">
                                                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-xs shadow-xs ${r.highlight ? 'bg-rose-400' : 'bg-blue-600'}`}>{r.initials}</div>
                                                        <div>
                                                            <div className="text-sm font-extrabold text-slate-800 leading-snug">{r.name}</div>
                                                            <div className={`text-[10px] font-semibold ${r.highlight ? 'text-rose-500' : 'text-slate-400'}`}>{r.submitted}</div>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <div className="text-xs font-bold text-slate-700">{r.institution}</div>
                                                        <div className="text-[10px] font-semibold text-slate-400">{r.dept}</div>
                                                    </div>

                                                    <div className="col-span-3 flex items-center space-x-3">
                                                        <div className="flex items-center">
                                                            {r.domainConfirmed ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 gap-1">
                                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                    Domain Confirmed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100 gap-1">
                                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    Non-University Email
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-xs font-bold text-blue-600">{r.docs} Docs</div>
                                                    </div>

                                                    <div className="col-span-2 flex justify-end">
                                                        <button
                                                            onClick={() => setSelectedID(r.verificationID)}
                                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-200/60 active:scale-95 transition-all"
                                                        >
                                                            Review
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedID && (
                                <ReviewModal
                                    verificationID={selectedID}
                                    onClose={() => setSelectedID(null)}
                                    onReviewed={() => {
                                        // re-fetch the list to remove the reviewed row
                                        setRows(prev => prev.filter(r => r.verificationID !== selectedID));
                                    }}
                                />
                            )}
                        </div>
                    </main>
                </div>
    );
}

export default OrganizerApprovals