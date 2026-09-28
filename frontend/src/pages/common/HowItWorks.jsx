import { Link } from 'react-router-dom';
import Navbar from './component/Navbar';
import { useState } from 'react';
import Footer from './component/Footer';



import { Search, CreditCard, FileText, TrendingUp,ChevronDown,ChevronUp } from "lucide-react";


function HowItWorks() {
    const [activeTab, setActiveTab] = useState("donor");
    const [openFAQ, setOpenFAQ] = useState(null);
    const organizerSteps = [
        {
            step: '01',
            title: 'Register Your Club',
            description: 'Sign up using your official university representative details and select your student association or club brand.',
            icon: <Search />,
            color: 'from-amber-500 to-orange-500',
        },
        {
            step: '02',
            title: 'Launch a Campaign',
            description: 'Fill in your fundraising goal, detailed descriptions, budget break-downs, images, and end date.',
            icon: <TrendingUp />,
            color: 'from-rose-500 to-pink-500',
        },
        {
            step: '03',
            title: 'Admin Verification Review',
            description: 'Our centralized university board reviews the legitimacy of the request. Verified projects instantly go public.',
            icon: <CreditCard />,
            color: 'from-emerald-500 to-teal-500',
        },
        {
            step: '04',
            title: 'Receive approved payouts',
            description: 'Track slip approvals live in your dashboard. Receive approved manual/card deposits directly to your registered bank account.',
            icon: <FileText />,
            color: 'from-cyan-500 to-blue-500',
        },
    ];

    const donorSteps = [
        {
            step: '01',
            title: 'Explore Campaigns',
            description: 'Browse verified student campaigns across top Sri Lankan universities. Filter by education, technology, sports, or charity.',
            icon: '🔍',
            color: 'from-blue-500 to-indigo-500',
        },
        {
            step: '02',
            title: 'Choose Donation Mode',
            description: 'Contribute instantly via secure local/international cards, or perform a direct bank transfer.',
            icon: '💳',
            color: 'from-amber-500 to-orange-500',
        },
        {
            step: '03',
            title: 'Upload Bank Slip',
            description: 'If you choose manual bank deposit, upload a clear photo/PDF of your bank slip.',
            icon: '📄',
            color: 'from-purple-500 to-violet-500',
        },
        {
            step: '04',
            title: 'Track Your Impact',
            description: 'Once approved, your donation appears in the campaign and project progress updates.',
            icon: '📈',
            color: 'from-emerald-500 to-green-500',
        },
    ];

    const faqData = [
  {
    question: "How does the verification process work?",
    answer:
      "Organizers using official university email addresses are automatically verified. Organizers using personal emails must upload supporting documents such as student IDs or club approval letters. The admin reviews and approves these requests."
  },
  {
    question: "Is my donation secure?",
    answer:
      "Yes. All donations are recorded within the platform. Manual bank transfers require slip verification and only approved donations are added to campaign totals."
  },
  {
    question: "How are donor badges earned?",
    answer:
      "Donors receive badges based on their contribution levels and participation. Higher contributions unlock additional recognition and promotional benefits."
  },
  {
    question: "Can anyone start a fundraiser?",
    answer:
      "No. Only verified university clubs, societies, and approved organizers can create fundraising campaigns through FundUp."
  }
];

    return (
        <>
            <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-white relative overflow-hidden">
                <Navbar />

                {/* Dynamic Animated Blobs */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Main Header */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-wider">
                            📚 Simple & Transparent Flow
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
                            How does <span className="text-blue-600">FundUp</span> Work?
                        </h1>
                        <p className="text-slate-600 text-base sm:text-lg">
                            Empowering Sri Lankan university communities with centralized crowdfunding, robust moderation, and absolute transparency.
                        </p>
                    </div>
                </section>


                <section className="flex justify-center mb-14 relative z-10">
                    <div className="bg-slate-200 rounded-full p-1 flex">

                        <button
                            onClick={() => setActiveTab("donor")}
                            className={`px-6 py-3 rounded-full font-semibold transition-all ${activeTab === "donor"
                                ? "bg-white text-blue-600 shadow"
                                : "text-slate-600"
                                }`}
                        >
                            🎓 For Donors
                        </button>

                        <button
                            onClick={() => setActiveTab("organizer")}
                            className={`px-6 py-3 rounded-full font-semibold transition-all ${activeTab === "organizer"
                                ? "bg-white text-blue-600 shadow"
                                : "text-slate-600"
                                }`}
                        >
                            🏛️ For Club Organizers
                        </button>

                    </div>
                </section>



                {/* Steps Grid Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        {(activeTab === "donor" ? donorSteps : organizerSteps).map((step, idx) => (
                            <div
                                key={idx}
                                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group"
                            >

                                {/* Stepper Label Badge */}
                                <div className="absolute -top-4 right-6 bg-slate-50 border border-slate-100 text-slate-400 font-extrabold text-sm px-3.5 py-1 rounded-full group-hover:bg-primary-50 group-hover:text-primary-500 group-hover:border-primary-100 transition-colors duration-300">
                                    Step {step.step}
                                </div>

                                {/* Step Icon */}
                                <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-3xl shadow-md text-white mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                                    {step.icon}
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-3">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-500 text-sm leading-relaxed flex-grow">
                                    {step.description}
                                </p>

                            </div>
                        ))}

                    </div>
                </section>

                {/* Safety Slip Verification Details Card */}
                <section className="max-w-4xl mx-auto px-4 relative z-10">
                    <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10 border border-slate-800 relative">

                        {/* Neon pattern decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                            <div className="space-y-4 max-w-xl">
                                <span className="inline-block bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
                                    🛡️ Trust & Security First
                                </span>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {activeTab === "donor"
                                        ? "Every donation is verified before being counted towards a campaign. Donors can track project progress and fundraising updates in real time."
                                        : "University organizations are verified through university emails or supporting documents before they can publish fundraising campaigns."}
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    In Sri Lanka, manual bank deposits and online transfers are highly popular. To prevent duplicate uploads or Photoshop fraud, FundUp requires donors to submit their official transfer slip, which goes directly to the project Organizer for verification. Only verified slips count towards the project's total raised amount.
                                </p>
                            </div>

                            <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-center hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/15"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    to="/projects"
                                    className="bg-slate-800 text-center hover:bg-slate-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all border border-slate-700"
                                >
                                    Browse Projects
                                </Link>
                            </div>
                        </div>

                    </div>
                </section><br></br><br></br>

                {/* FAQ Section */}
<section className="max-w-4xl mx-auto px-6 pb-20">

  <h2 className="text-4xl font-bold text-center text-slate-800">
    Frequently Asked Questions
  </h2>

  <p className="text-center text-gray-500 mt-3">
    Everything you need to know about FundUp.
  </p>

  <div className="space-y-4 mt-10">

    {faqData.map((faq, index) => (
      <div
        key={index}
        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
      >

        {/* Question */}
        <button
          onClick={() =>
            setOpenFAQ(openFAQ === index ? null : index)
          }
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <span className="font-semibold text-slate-800">
            {faq.question}
          </span>

          {openFAQ === index ? (
            <ChevronUp
              size={18}
              className="text-slate-500"
            />
          ) : (
            <ChevronDown
              size={18}
              className="text-slate-500"
            />
          )}
        </button>

        {/* Answer */}
        {openFAQ === index && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <p className="text-slate-600 text-sm leading-relaxed pt-4">
              {faq.answer}
            </p>
          </div>
        )}

      </div>
    ))}

  </div>

</section>
                

            </div>
            <Footer />
        </>

    );
}

export default HowItWorks;