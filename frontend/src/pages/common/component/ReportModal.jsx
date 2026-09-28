import { useState } from 'react';
import { reportProject } from '../../../services/authService';

const REPORT_REASONS = [
  'Fraudulent Campaign or Scam',
  'Misleading or False Information',
  'Inappropriate Content or Media',
  'Copyright / Intellectual Property Infringement',
  'Suspicious Financial Activity',
  'Other Reason'
];

function ReportModal({ isOpen, onClose, project }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for reporting this project.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const targetProjectID = project.projectID || project.id;
      const response = await reportProject({
        projectID: targetProjectID,
        reason,
        description
      });

      if (response.data && response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setReason('');
          setDescription('');
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred while submitting your report.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    if (loading) return;
    setError(null);
    setSuccess(false);
    setReason('');
    setDescription('');
    onClose();
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative bg-white shadow-2xl border border-slate-100 rounded-3xl w-full max-w-lg overflow-hidden animate-scale-up"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-50/80 px-6 py-5 border-slate-100 border-b">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center bg-red-100/80 rounded-2xl w-10 h-10 text-red-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Report Campaign</h3>
              <p className="line-clamp-1 font-semibold text-[11px] text-slate-400">
                {project.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            disabled={loading}
            className="flex justify-center items-center rounded-full w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center">
              <div className="inline-flex justify-center items-center bg-emerald-100 mb-4 rounded-full w-14 h-14 text-emerald-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-extrabold text-slate-800 text-lg">Report Submitted</h4>
              <p className="mt-2 font-medium text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                Thank you for helping keep FundUp safe. Our administration team will review your report shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 p-4 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-xs leading-relaxed">{error}</p>
                </div>
              )}

              <div>
                <label className="block mb-2 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  required
                >
                  <option value="">-- Select a Reason --</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Additional Details & Evidence <span className="text-slate-400 font-medium lowercase">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide any additional details or context to help our moderators review this campaign..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 shadow-md shadow-red-500/20 px-6 py-3 rounded-2xl font-bold text-xs text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
