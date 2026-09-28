import React, { useEffect, useState } from 'react'
import { getOrganizerDetails, reviewOrganizer } from '../../../services/authService'

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/uploads/`

function ReviewModal({ verificationID, onClose, onReviewed }) {

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [remarks, setRemarks] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        getOrganizerDetails(verificationID)
            .then(response => {
                if (response.data && response.data.success) {
                    setData(response.data.data)
                }
            })
            .catch(error => {
                console.error('Failed to load organizer details', error)
            })
            .finally(() => setLoading(false))
    }, [verificationID])

    async function handleAction(action) {
        setSubmitting(true)
        try {
            const response = await reviewOrganizer(verificationID, action, remarks)
            if (response.data && response.data.success) {
                onReviewed()
                onClose()
            } else {
                alert(response.data?.message || 'Review failed')
            }
        } catch (error) {
            alert(error?.message || 'Review failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
            >

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Review Organizer</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : !data ? (
                    <div className="p-8 text-center text-red-500">Failed to load details.</div>
                ) : (
                    <div className="px-6 py-5 space-y-5">

                        {/* Organizer Info */}
                        <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                {data.fullName?.split(' ').slice(0, 2).map(w => w[0]).join('')}
                            </div>
                            <div>
                                <div className="text-base font-semibold text-gray-900">{data.fullName}</div>
                                <div className="text-sm text-gray-500">{data.email}</div>
                                {data.phoneNo && <div className="text-sm text-gray-500">{data.phoneNo}</div>}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                            <div>
                                <div className="text-xs text-gray-400 uppercase mb-1">Organization</div>
                                <div className="font-medium text-gray-800">{data.organizationName}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase mb-1">University</div>
                                <div className="font-medium text-gray-800">{data.universityName}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase mb-1">Email Domain</div>
                                <div className={`font-medium ${data.verificationStatus === 'VERIFIED' ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.verificationStatus === 'VERIFIED' ? '✓ University Email' : '✗ Non-University Email'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase mb-1">Registered</div>
                                <div className="font-medium text-gray-800">{new Date(data.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Submitted Documents</div>
                            <div className="space-y-2">
                                {data.approvalLetterPath && (

                                    <a href={`${BASE_URL}approval_letters/${data.approvalLetterPath.split('/').pop()}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm text-indigo-600 hover:bg-indigo-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span>Approval Letter</span>
                                    </a>
                                )}
                                {data.studentIdPath && (

                                    <a href={`${BASE_URL}student_ids/${data.studentIdPath.split('/').pop()}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm text-indigo-600 hover:bg-indigo-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                                        </svg>
                                        <span>Student ID</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Remarks <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Add a note for the organizer..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-2 border-t">
                            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction('REJECTED')}
                                disabled={submitting}
                                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction('APPROVED')}
                                disabled={submitting}
                                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Approve
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

export default ReviewModal