import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../../../assets/images/FundUp logo-CRF5i8gW.png';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const navigate = useNavigate();

    {/* Function to handle the "Impact Stories" link click in footer*/}
    const handleImpactStoriesClick = (event) => {
        event.preventDefault();

        const scrollToTestimonials = () => {
            const testimonialsSection = Array.from(document.querySelectorAll('section'))
                .find((section) => section.textContent.includes('Impact Stories'));

            testimonialsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        if (location.pathname === '/') {
            scrollToTestimonials();
            return;
        }

        navigate('/');
        requestAnimationFrame(() => requestAnimationFrame(scrollToTestimonials));
    };

    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center shrink-0 group w-fit">
                            <img
                                src={logoImg}
                                alt="FundUp Logo"
                                className="h-16 w-auto object-contain brightness-0 invert opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                            />
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Sri Lanka's premier centralized fundraising platform built specifically for university clubs, events, social work, and educational initiatives. Empowering transparency and building community trust.
                        </p>

                        {/* Social Icons */}
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com" target="_blank" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300 shadow-md">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h2V1H13c-3 0-4 2-4 4v3z" /></svg>
                            </a>
                            <a href="https://www.twitter.com" target="_blank" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-400 hover:-translate-y-1 transition-all duration-300 shadow-md">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                            </a>
                            <a href="https://www.instagram.com" target="_blank" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-pink-600 hover:-translate-y-1 transition-all duration-300 shadow-md">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            </a>
                            <a href="https://www.linkedin.com" target="_blank" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 shadow-md">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Column */}
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-6">Explore</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/projects" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    Campaigns
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    About FundUp
                                </Link>
                            </li>
                            <li>
                                <Link to="/how-it-works" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link to="/#testimonials" onClick={handleImpactStoriesClick} className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    Impact Stories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-6">User Portals</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/register" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    Start a Campaign
                                </Link>
                            </li>

                            <li>
                                <Link to="/login" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    Organizer Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group">
                                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors duration-200" />
                                    System Admin
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact / Secure Badges Column */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-6">Contact & Support</h3>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li className="flex items-start gap-2.5">
                                    <span className="text-primary-400 mt-0.5">📍</span>
                                    <span>Sri Lankan Universities Coordination Hub, Colombo, SL</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="text-primary-400">✉️</span>
                                    <a href="mailto:support@fundup.lk" className="hover:text-white transition-colors duration-200">support@fundup.lk</a>
                                </li>
                            </ul>
                        </div>

                        {/* Safety badge */}
                        <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-3 w-fit">
                            <span className="text-emerald-400 text-2xl">🛡️</span>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wider">Secured Transactions</p>
                                <p className="text-[10px] text-slate-500">Verified bank slips & approvals</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Divider */}
                <div className="border-t border-slate-800 my-8"></div>

                {/* Bottom copyright and legal */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© {currentYear} FundUp. All rights reserved. Registered University Fundraising Platform.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-400 transition-colors duration-200">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-400 transition-colors duration-200">Terms of Service</a>
                        <a href="#" className="hover:text-slate-400 transition-colors duration-200">Cookie Settings</a>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
