import { useState, useEffect } from 'react';
import { getPayhereParams, createDonation } from '../../../services/authService';
import { compressImage } from '../../../utils/imageCompressor';

export default function DonateModal({ isOpen, onClose, project, onDonationSuccess }) {
  const [amount, setAmount] = useState('1000');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'BANK_SLIP'
  const [recognitionRequired, setRecognitionRequired] = useState(true);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Commercialization / Sponsorship states (for donations >= 50,000)
  const [showCommercialSection, setShowCommercialSection] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [adMediaFile, setAdMediaFile] = useState(null);
  const [adMediaPreview, setAdMediaPreview] = useState(null);
  const [adMediaType, setAdMediaType] = useState('IMAGE'); // 'IMAGE' or 'VIDEO'

  // Lightbox Zoom state for uploaded files
  const [zoomMedia, setZoomMedia] = useState(null);

  // Terms & Confirmation Agreement State
  const [termsAgreed, setTermsAgreed] = useState(false);

  const presets = ['500', '1000', '2000', '5000', '50000'];

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setAmount('1000');
      setCustomAmount('');
      setPaymentMethod('ONLINE');
      setRecognitionRequired(true);
      setTermsAgreed(false);
      setSlipFile(null);
      setSlipPreview(null);
      setLoading(false);
      setError(null);
      setSuccessData(null);
      setShowCommercialSection(false);
      setCompanyName('');
      setWebsiteLink('');
      setAdMediaFile(null);
      setAdMediaPreview(null);
      setAdMediaType('IMAGE');
      setZoomMedia(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountSelect = (val) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    if (val === '' || (/^\d+$/).test(val)) {
      setCustomAmount(val);
      setAmount('');
    }
  };

  const finalAmount = amount ? parseFloat(amount) : parseFloat(customAmount || '0');

  const targetGoal = Number(project?.targetAmount || project?.goal || 0);
  const currentRaised = Number(project?.collectedAmount || project?.raised || 0);
  const remainingNeeded = Math.max(0, targetGoal - currentRaised);
  const isExceedingGoal = targetGoal > 0 && finalAmount > remainingNeeded;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setError(null);
      const optimized = await compressImage(file, 1400, 0.85);
      setSlipFile(optimized);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(optimized);
    }
  };

  const handleAdMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError("Ad media file size exceeds 50MB limit.");
        return;
      }
      setAdMediaFile(file);
      const isVideo = file.type.startsWith('video/');
      setAdMediaType(isVideo ? 'VIDEO' : 'IMAGE');
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAdMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async () => {
    if (!termsAgreed) {
      setError("Please tick the confirmation checkbox to agree to the campaign details and contribution terms before proceeding.");
      return;
    }

    if (finalAmount <= 0) {
      setError("Please select or enter a valid donation amount.");
      return;
    }

    const targetGoal = Number(project.targetAmount || project.goal || 0);
    const currentRaised = Number(project.collectedAmount || project.raised || 0);
    const remainingNeeded = Math.max(0, targetGoal - currentRaised);
    const endDate = project.endDate || project.end_date;
    const isEndDatePassed = Boolean(endDate && new Date(endDate).setHours(23, 59, 59, 999) < Date.now());

    if (isEndDatePassed || project.status === 'COMPLETED') {
      setError("This campaign has reached its end date and is now closed to new contributions.");
      return;
    }

    if (targetGoal > 0 && currentRaised >= targetGoal) {
      setError("This campaign has already reached its full target funding goal.");
      return;
    }

    if (targetGoal > 0 && finalAmount > remainingNeeded) {
      setError(`Donation amount exceeds the remaining goal amount. Maximum contribution allowed for this campaign is Rs. ${remainingNeeded.toLocaleString()}.`);
      return;
    }

    setError(null);
    setLoading(true);

    if (paymentMethod === 'ONLINE') {
      try {
        // 1. Get secure parameters and hash from PHP backend
        const response = await getPayhereParams({
          amount: finalAmount,
          projectID: project.projectID || project.id
        });

        if (response.data && response.data.success) {
          const params = response.data.data;

          // 2. Define PayHere parameters object
          const paymentPayload = {
            sandbox: params.sandbox,
            merchant_id: params.merchant_id,
            return_url: window.location.origin + "/donor-dashboard?payment=success",
            cancel_url: window.location.origin + "/projects/" + (project.projectID || project.id) + "?payment=cancel",
            notify_url: `${import.meta.env.VITE_BACKEND_URL || 'https://fundup-backend-cbfbh7d5gtdscxgg.southafricanorth-01.azurewebsites.net'}/api/donor/payhereNotify.php`,
            order_id: params.order_id,
            items: params.projectTitle,
            amount: params.amount.toFixed(2),
            currency: params.currency,
            hash: params.hash,
            first_name: params.first_name,
            last_name: params.last_name,
            email: params.email,
            phone: params.phone,
            address: "FundUp Campus Community Fund",
            city: "Colombo",
            country: "Sri Lanka"
          };

          // 3. Initialize PayHere Checkout Popup
          window.payhere.startPayment(paymentPayload);

          // 4. Configure listeners for checkout popup events
          window.payhere.onCompleted = async function (orderId) {
            try {
              let donationData;
              if (adMediaFile) {
                donationData = new FormData();
                donationData.append("projectID", project.projectID || project.id);
                donationData.append("amount", finalAmount);
                donationData.append("paymentMethod", "ONLINE");
                donationData.append("recognitionRequired", recognitionRequired ? "true" : "false");
                donationData.append("orderID", orderId);
                donationData.append("companyName", companyName.trim());
                if (websiteLink.trim()) donationData.append("websiteLink", websiteLink.trim());
                donationData.append("adMedia", adMediaFile);
              } else {
                donationData = {
                  projectID: project.projectID || project.id,
                  amount: finalAmount,
                  paymentMethod: 'ONLINE',
                  recognitionRequired: recognitionRequired,
                  orderID: orderId,
                  companyName: companyName.trim(),
                  websiteLink: websiteLink.trim()
                };
              }

              // Register approved transaction on backend
              const regResponse = await createDonation(donationData);

              if (regResponse.data && regResponse.data.success) {
                setSuccessData({
                  method: 'ONLINE',
                  amount: finalAmount,
                  transactionID: orderId
                });
                if (onDonationSuccess) {
                  onDonationSuccess();
                }
              } else {
                setError(regResponse.data.message || "Failed to register transaction.");
              }
            } catch (err) {
              console.error("Verification error:", err);
              setError("Error registering donation record on server.");
            } finally {
              setLoading(false);
            }
          };

          window.payhere.onDismissed = function () {
            setLoading(false);
            setError("Checkout was dismissed by user.");
          };

          window.payhere.onError = function (errStr) {
            setLoading(false);
            setError("PayHere Gateway Error: " + errStr);
          };

        } else {
          setError(response.data.message || "Failed to initiate payment gateway.");
          setLoading(false);
        }
      } catch (err) {
        console.error("PayHere parameters error:", err);
        setError("Unable to connect to payment gateway service.");
        setLoading(false);
      }
    } else {
      // BANK SLIP UPLOAD
      if (!slipFile) {
        setError("Please upload your bank transfer slip image.");
        setLoading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("projectID", project.projectID || project.id);
        formData.append("amount", finalAmount);
        formData.append("paymentMethod", "BANK_SLIP");
        formData.append("recognitionRequired", recognitionRequired ? "true" : "false");
        formData.append("slipImage", slipFile);
        if (finalAmount >= 50000 && companyName.trim()) {
          formData.append("companyName", companyName.trim());
          if (websiteLink.trim()) formData.append("websiteLink", websiteLink.trim());
          if (adMediaFile) formData.append("adMedia", adMediaFile);
        }

        const response = await createDonation(formData);

        if (response.data && response.data.success) {
          setSuccessData({
            method: 'BANK_SLIP',
            amount: finalAmount
          });
          if (onDonationSuccess) {
            onDonationSuccess();
          }
        } else {
          setError(response.data.message || "Failed to submit bank slip.");
        }
      } catch (err) {
        console.error("Bank slip upload error:", err);
        setError("Error connecting to server. Please verify your file format.");
      } finally {
        setLoading(false);
      }
    }
  };

  const isGoalReached = project && Number(project.targetAmount) > 0 && Number(project.collectedAmount || 0) >= Number(project.targetAmount);

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-slate-900/50 selection:bg-blue-600 backdrop-blur-sm p-4 overflow-hidden selection:text-white antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Container */}
      <div className="relative flex flex-col bg-white shadow-2xl border border-slate-100 rounded-[2.5rem] w-full max-w-[520px] max-h-[88vh] overflow-hidden animate-in duration-200 fade-in zoom-in-95">

        {/* Glow Effects */}
        <div className="-top-24 -right-24 absolute bg-blue-500/10 blur-[60px] rounded-full w-64 h-64 pointer-events-none" />
        <div className="-bottom-24 -left-24 absolute bg-emerald-500/10 blur-[60px] rounded-full w-64 h-64 pointer-events-none" />

        {/* Modal Header (Fixed at top) */}
        <div className="flex flex-none justify-between items-center px-6 sm:px-8 pt-6 sm:pt-7 pb-3 sm:pb-3 border-slate-50 border-b">
          <div className="space-y-1">
            <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Back this campaign</span>
            <h3 className="font-black text-slate-800 text-lg line-clamp-1 leading-snug">{project.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-slate-50 shadow-sm p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* If Goal Reached */}
        {isGoalReached ? (
          <div className="flex-1 space-y-6 p-8 pb-10 overflow-y-auto text-center">
            <div className="flex justify-center items-center">
              <span className="inline-flex bg-emerald-50 p-4.5 border-2 border-emerald-100 rounded-full text-emerald-500">
                <span className="text-3xl">🎉</span>
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-800 text-xl">Goal Fully Funded!</h4>
              <p className="mx-auto max-w-sm font-semibold text-slate-500 text-xs leading-relaxed">
                This project has successfully reached its required target amount. Additional contributions are closed. Thank you for your support!
              </p>
            </div>

            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg px-8 py-3.5 rounded-2xl font-black text-white text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Back to Campaign
            </button>
          </div>
        ) : successData ? (
          <div className="flex-1 space-y-6 p-8 pb-10 overflow-y-auto text-center">
            <div className="flex justify-center items-center">
              <span className="inline-flex bg-emerald-50 p-4.5 border-2 border-emerald-100 rounded-full text-emerald-500 animate-bounce">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-800 text-xl">Thank you for your support!</h4>
              <p className="mx-auto max-w-sm font-semibold text-slate-500 text-xs leading-relaxed">
                {successData.method === 'ONLINE'
                  ? `Your contribution of Rs. ${successData.amount.toLocaleString()} was processed successfully. Transaction ID: ${successData.transactionID}.`
                  : `Your bank slip for Rs. ${successData.amount.toLocaleString()} was uploaded. It will be verified by the campaign organizers shortly.`}
              </p>
            </div>

            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg px-8 py-3.5 rounded-2xl font-black text-white text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Back to Campaign
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Form Body */}
            <div className="flex-1 space-y-5 px-6 sm:px-8 py-4 overflow-y-auto custom-scrollbar">

              {/* Amount Selection presets */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Select Donation Amount</label>
                  {Number(project?.targetAmount || project?.goal || 0) > 0 && (
                    <span className="font-bold text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Remaining needed: Rs. {Math.max(0, Number(project.targetAmount || project.goal || 0) - Number(project.collectedAmount || project.raised || 0)).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="gap-2 grid grid-cols-5">
                  {presets.map((val) => {
                    const isHighlight = val === '50000';
                    const isSelected = amount === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleAmountSelect(val)}
                        className={`py-2.5 px-1 rounded-xl text-[11px] font-extrabold transition-all duration-150 cursor-pointer text-center truncate ${isHighlight
                            ? isSelected
                              ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-200 scale-[1.03] ring-2 ring-blue-200'
                              : 'bg-blue-50/80 border border-blue-200 text-blue-600 hover:bg-blue-100/70 hover:border-blue-300 shadow-xs'
                            : isSelected
                              ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-100 scale-[1.03]'
                              : 'border border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50 bg-[#f8fafc]'
                          }`}
                      >
                        Rs.{parseInt(val).toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                {/* Custom amount input */}
                <div className="relative mt-2">
                  <span className={`left-0 absolute inset-y-0 flex items-center pl-4 font-black text-xs ${isExceedingGoal ? 'text-red-500' : 'text-slate-400'}`}>
                    Rs.
                  </span>
                  <input
                    type="text"
                    placeholder="Enter custom amount..."
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className={`bg-[#f8fafc] shadow-sm py-3 pr-4 pl-10 rounded-xl focus:outline-none w-full font-bold text-xs transition-all placeholder-slate-400 ${
                      isExceedingGoal
                        ? 'border-2 border-red-500 text-red-600 focus:ring-2 focus:ring-red-100'
                        : 'border border-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-700'
                    }`}
                  />
                </div>

                {/* Real-time Inline Over-Donation Error Alert */}
                {isExceedingGoal && (
                  <div className="flex items-center gap-2 mt-2 bg-red-50 p-3 border border-red-200 rounded-xl text-red-600 font-bold text-xs leading-snug">
                    <span className="text-sm">⚠️</span>
                    <span>Donation amount cannot exceed the remaining campaign goal of Rs. {remainingNeeded.toLocaleString()}.</span>
                  </div>
                )}
              </div>

              {/* Toggle Payment Method Tabs */}
              <div className="space-y-2.5">
                <label className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Choose Payment Method</label>

                <div className="z-10 relative flex bg-[#f8fafc] p-1 border border-slate-100 rounded-2xl select-none">
                  <button
                    onClick={() => { setPaymentMethod('ONLINE'); setError(null); }}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${paymentMethod === 'ONLINE'
                        ? 'bg-white shadow-sm border border-slate-100 text-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    💳 Card Checkout (PayHere)
                  </button>
                  <button
                    onClick={() => { setPaymentMethod('BANK_SLIP'); setError(null); }}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${paymentMethod === 'BANK_SLIP'
                        ? 'bg-white shadow-sm border border-slate-100 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    🏢 Bank Transfer (Manual)
                  </button>
                </div>
              </div>

              {/* Payment Method Details container with consistent height footprint */}
              <div className="flex flex-col justify-center min-h-[230px]">
                {paymentMethod === 'ONLINE' ? (
                  /* Online Details */
                  <div className="relative space-y-3 bg-blue-50/40 p-4.5 border border-blue-100/60 rounded-2xl overflow-hidden transition-all duration-200 ease-in-out">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 font-extrabold text-[10px] text-blue-600 uppercase tracking-wider">
                        <span>🔒</span> PayHere Gateway Summary
                      </span>
                      <span className="bg-blue-100 px-2 py-0.5 rounded-full font-extrabold text-[8px] text-blue-600 uppercase tracking-wider">
                        Sandbox Mode
                      </span>
                    </div>

                    <div className="space-y-1.5 font-bold text-[11px] text-slate-600 leading-relaxed">
                      <div className="flex justify-between items-center">
                        <span>Gateway Mode:</span>
                        <span className="font-semibold text-slate-800">Secure Sandboxed Portal</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Merchant ID:</span>
                        <span className="font-mono text-slate-800">1236886</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Accepted Methods:</span>
                        <span className="text-[10px] text-slate-700">Visa, MasterCard, Amex, eZ Cash</span>
                      </div>
                      <div className="flex justify-between items-center mt-1 pt-2 border-blue-100/60 border-t text-xs">
                        <span className="font-black text-slate-700">Total Charged (LKR):</span>
                        <span className="font-black text-blue-600 text-sm">Rs. {finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="bg-blue-100/40 p-2 rounded-xl font-semibold text-[10px] text-blue-700 text-center">
                      ✨ Instant verification & auto-generated receipt upon payment.
                    </div>
                  </div>
                ) : (
                  /* Bank Transfer Details */
                  <div className="space-y-3 transition-all duration-200 ease-in-out">
                    {/* Compact Bank Account Info */}
                    <div className="space-y-1.5 bg-emerald-50/40 p-3.5 border border-emerald-100/60 rounded-2xl font-bold text-[11px] text-slate-600">
                      <div className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-1 font-extrabold text-[9px] text-emerald-700 uppercase tracking-wider">
                          <span>🏦</span> Bank Account Details
                        </span>
                        <span className="bg-emerald-100/60 px-2 py-0.5 rounded-full font-bold text-[9px] text-emerald-600">Manual Verification</span>
                      </div>
                      <div className="gap-x-3 gap-y-1 grid grid-cols-2 text-[10.5px]">
                        <div><span className="block font-extrabold text-[9px] text-slate-400 uppercase">Bank</span><span className="text-slate-800">University Trust Bank</span></div>
                        <div><span className="block font-extrabold text-[9px] text-slate-400 uppercase">Account Name</span><span className="block text-slate-800 truncate">FundUp Campus Fund</span></div>
                        <div><span className="block font-extrabold text-[9px] text-slate-400 uppercase">Account No</span><span className="font-mono font-bold text-slate-800 text-xs">1000-2495-8831</span></div>
                        <div><span className="block font-extrabold text-[9px] text-slate-400 uppercase">Branch</span><span className="text-slate-800">Colombo Main</span></div>
                      </div>
                    </div>

                    {/* Compact Slip Upload Section */}
                    <div className="space-y-1.5">
                      <label className="block font-black text-[10px] text-slate-400 uppercase tracking-wider">Upload Payment Receipt Slip</label>

                      <div className="flex items-center gap-3 bg-slate-50 p-2.5 border border-slate-100 rounded-2xl">
                        <label className="group relative flex flex-col justify-center items-center bg-white hover:bg-white shadow-xs border-2 border-slate-200 hover:border-emerald-500 border-dashed rounded-xl w-16 h-16 overflow-hidden transition-all cursor-pointer shrink-0">
                          {slipPreview ? (
                            <img src={slipPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center p-1 text-slate-400 text-center">
                              <span className="text-base">📁</span>
                              <span className="mt-0.5 font-extrabold text-[7px] text-slate-500 uppercase">Upload</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h5 className="font-extrabold text-slate-800 text-xs truncate">
                              {slipFile ? slipFile.name : "Select deposit slip image"}
                            </h5>
                            {slipFile && (
                              <div className="flex items-center gap-2 ml-2">
                                {slipPreview && (
                                  <button
                                    type="button"
                                    onClick={() => setZoomMedia({ url: slipPreview, type: 'IMAGE', title: 'Payment Receipt Slip Preview' })}
                                    className="flex items-center gap-1 font-extrabold text-[9px] text-emerald-600 hover:text-emerald-800 uppercase tracking-wider cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                                    title="Click to zoom preview"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                    </svg>
                                    Zoom
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                                  className="flex items-center gap-0.5 font-extrabold text-[9px] text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-[10px] text-slate-400 leading-tight">
                            {slipFile ? `Optimized Size: ${(slipFile.size / 1024).toFixed(1)} KB` : "Supports JPEG or PNG (automatically optimized for fast upload)."}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Campaign Terms & Confirmation Agreement Checkbox */}
              <label className={`flex items-start gap-3 p-4 border rounded-2xl transition-all cursor-pointer select-none ${
                termsAgreed
                  ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => {
                    setTermsAgreed(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="mt-0.5 bg-white border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:ring-offset-0 w-4.5 h-4.5 text-blue-600 cursor-pointer shrink-0"
                />
                <div className="space-y-1 text-left">
                  <span className="block font-black text-slate-800 text-xs leading-snug">
                    I confirm that I have read and agree to all campaign details & terms
                  </span>
                  <span className="block font-semibold text-[10px] text-slate-500 leading-normal">
                    By checking this box, I acknowledge that I have reviewed the campaign proposal, target goals, and contribution terms. I understand that all contributions go directly toward supporting this university project and are non-refundable.
                  </span>
                </div>
              </label>

              {/* Commercialization / Sponsorship Ad Option for donations >= 50,000 LKR */}
              {finalAmount >= 50000 && (
                <div className="space-y-3 animate-fadeIn">
                  {/* Unlocked Perk Banner & Toggle Button */}
                  <div className="flex justify-between items-center bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 shadow-sm p-3.5 border border-purple-200/80 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex justify-center items-center bg-purple-600 shadow-md shadow-purple-200 rounded-xl w-9 h-9 font-black text-white text-base shrink-0">
                        🏢
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-xs">Commercial Sponsorship</span>
                          <span className="bg-purple-100 px-2 py-0.5 rounded-full font-extrabold text-[8px] text-purple-700 uppercase tracking-wider">
                            Unlocked (Rs. 50,000+)
                          </span>
                        </div>
                        <p className="font-semibold text-[10px] text-slate-500 leading-tight">
                          Promote your company & media advertisement on our homepage.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCommercialSection(!showCommercialSection)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer border flex items-center gap-1.5 shrink-0 ${showCommercialSection
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100'
                          : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                        }`}
                    >
                      <span>{showCommercialSection ? 'Hide Form' : 'Add Details'}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showCommercialSection ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Collapsible Form Section */}
                  {showCommercialSection && (
                    <div className="space-y-3 bg-purple-50/40 p-4 border border-purple-100 rounded-2xl animate-in duration-150 fade-in zoom-in-95">
                      <div className="flex justify-between items-center pb-2 border-purple-100 border-b">
                        <span className="flex items-center gap-1 font-black text-[10px] text-purple-900 uppercase tracking-wider">
                          <span>✨</span> Company & Advertisement Information
                        </span>
                        <span className="bg-purple-100 px-2 py-0.5 rounded-md font-extrabold text-[9px] text-purple-600">
                          Sponsor Portal
                        </span>
                      </div>

                      {/* Company Name */}
                      <div className="space-y-1">
                        <label className="block font-black text-[10px] text-slate-500 uppercase tracking-wider">
                          Company Name <span className="text-purple-600">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Acme Innovations Corp"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="bg-white shadow-sm px-3 py-2 border border-slate-200 focus:border-purple-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 w-full font-bold text-slate-800 text-xs transition-all placeholder-slate-400"
                        />
                      </div>

                      {/* Website Link */}
                      <div className="space-y-1">
                        <label className="block font-black text-[10px] text-slate-500 uppercase tracking-wider">
                          Website Link / URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.yourcompany.com"
                          value={websiteLink}
                          onChange={(e) => setWebsiteLink(e.target.value)}
                          className="bg-white shadow-sm px-3 py-2 border border-slate-200 focus:border-purple-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 w-full font-bold text-slate-800 text-xs transition-all placeholder-slate-400"
                        />
                      </div>

                      {/* Upload Ad Media (Image or Video) */}
                      <div className="space-y-1">
                        <label className="block font-black text-[10px] text-slate-500 uppercase tracking-wider">
                          Upload Advertisement Media <span className="text-purple-600">*</span>
                        </label>

                        <div className="flex items-center gap-3 bg-white shadow-xs p-2.5 border border-purple-100 rounded-xl">
                          <label className="group relative flex flex-col justify-center items-center bg-white hover:bg-purple-50/50 border-2 border-purple-200 hover:border-purple-500 border-dashed rounded-xl w-16 h-16 overflow-hidden transition-all cursor-pointer shrink-0">
                            {adMediaPreview ? (
                              adMediaType === 'VIDEO' ? (
                                <video
                                  src={adMediaPreview}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={adMediaPreview}
                                  alt="Ad preview"
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="flex flex-col items-center p-1 text-purple-400 text-center">
                                <span className="text-base">📽️</span>
                                <span className="mt-0.5 font-extrabold text-[7px] text-purple-600 uppercase">
                                  Media
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleAdMediaChange}
                              className="hidden"
                            />
                          </label>

                          <div className="flex-1 space-y-0.5 min-w-0">
                            <div className="flex justify-between items-center">
                              <h5 className="font-extrabold text-slate-800 text-xs truncate">
                                {adMediaFile ? adMediaFile.name : "Choose Media File"}
                              </h5>
                              {adMediaFile && (
                                <div className="flex items-center gap-2 ml-2">
                                  {adMediaPreview && (
                                    <button
                                      type="button"
                                      onClick={() => setZoomMedia({ url: adMediaPreview, type: adMediaType, title: 'Advertisement Media Preview' })}
                                      className="flex items-center gap-1 font-extrabold text-[9px] text-purple-600 hover:text-purple-800 uppercase tracking-wider cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md transition-colors"
                                      title="Click to zoom preview"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                      </svg>
                                      Zoom
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdMediaFile(null);
                                      setAdMediaPreview(null);
                                    }}
                                    className="flex items-center gap-0.5 font-extrabold text-[9px] text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="font-medium text-[10px] text-slate-400 leading-tight">
                              {adMediaFile
                                ? `${adMediaType} (${(adMediaFile.size / (1024 * 1024)).toFixed(1)} MB)`
                                : "PNG, JPG, MP4 (Max 50MB)."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Errors */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 p-3.5 border border-red-100 rounded-2xl font-semibold text-red-600 text-xs leading-relaxed animate-shake">
                  <span className="mt-0.5 text-red-500">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

            </div>

            {/* Modal Fixed Footer with Action Buttons */}
            <div className="flex-none bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 sm:py-5 border-slate-100 border-t">
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 hover:bg-slate-50 py-3.5 border border-slate-200 rounded-2xl font-black text-slate-600 hover:text-slate-800 text-xs active:scale-95 transition-all cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCheckout}
                  disabled={loading || finalAmount <= 0 || isExceedingGoal || !termsAgreed}
                  className={`flex-[2] py-3.5 rounded-2xl text-white font-black text-xs active:scale-[0.98] transition-all hover:shadow-lg shadow-md flex items-center justify-center gap-2 cursor-pointer ${loading || finalAmount <= 0 || isExceedingGoal || !termsAgreed
                      ? 'bg-slate-300 shadow-none cursor-not-allowed opacity-80'
                      : paymentMethod === 'ONLINE'
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 hover:shadow-blue-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 hover:shadow-emerald-200'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                      <span>Processing checkout...</span>
                    </>
                  ) : !termsAgreed ? (
                    <span>Please Agree to Campaign Terms to Pay</span>
                  ) : (
                    <span>
                      {paymentMethod === 'ONLINE' ? `Verify via PayHere Gateway (Rs. ${finalAmount.toLocaleString()})` : `Submit Slip Receipt (Rs. ${finalAmount.toLocaleString()})`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lightbox Zoom Modal for uploaded files */}
      {zoomMedia && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full flex flex-col items-center gap-3">
            <div className="w-full flex justify-between items-center bg-slate-900/90 px-5 py-3 rounded-2xl border border-slate-800 text-white shadow-xl">
              <span className="font-extrabold text-xs tracking-wide flex items-center gap-2">
                <span className="text-base">🔍</span> {zoomMedia.title}
              </span>
              <button
                type="button"
                onClick={() => setZoomMedia(null)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Preview
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-3xl overflow-hidden shadow-2xl max-h-[75vh] w-full flex items-center justify-center">
              {zoomMedia.type === 'VIDEO' ? (
                <video
                  src={zoomMedia.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={zoomMedia.url}
                  alt="Zoomed media preview"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl select-none"
                />
              )}
            </div>

            <p className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">
              Click background or close button to exit zoom view
            </p>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setZoomMedia(null)} />
        </div>
      )}

    </div>
  );
}
