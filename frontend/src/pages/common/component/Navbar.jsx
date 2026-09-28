import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoImg from '../../../assets/images/FundUp logo-CRF5i8gW.png';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Add shadow on scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Home', to: '/' },
        { label: 'About', to: '/about' },
        { label: 'Projects', to: '/projects' },
        { label: 'How It Works', to: '/how-it-works' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/90 backdrop-blur-md shadow-md'
                : 'bg-white/60 backdrop-blur-sm shadow-sm'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* ── Logo ── */}
                    {/* ── Logo ── */}
                    <Link to="/" className="flex items-center shrink-0 group">
                        <img
                            src={logoImg}
                            alt="FundUp Logo"
                            className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                    </Link>

                    {/* ── Desktop Nav Links ── */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'text-blue-600 bg-blue-50 font-semibold'
                                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* ── Desktop Auth Buttons ── */}
                    <div className="hidden md:flex items-center gap-3">
                        <NavLink
                            to="/login"
                            className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2"
                        >
                            Login
                        </NavLink>
                        <NavLink
                            to="/register"
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors duration-200"
                        >
                            Get Started
                        </NavLink>
                    </div>
                    {/* ── Mobile Hamburger ── */}
                    <button
                        className="md:hidden p-2 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-slate-100 transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Mobile Menu ── */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-white border-t border-slate-100 px-4 py-3 space-y-1">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'text-blue-600 bg-blue-50 font-semibold'
                                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}

                    {/* Mobile Auth Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        <NavLink
                            to="/login"
                            className="block text-center py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                        >
                            Login
                        </NavLink>
                        <NavLink
                            to="/register"
                            className="block text-center py-2.5 px-4 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                        >
                            Get Started
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;