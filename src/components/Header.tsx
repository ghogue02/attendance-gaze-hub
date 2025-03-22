
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-6 ${
    isScrolled ? 'py-2 bg-white/80 backdrop-blur-md shadow-sm' : 'py-4 bg-transparent'
  }`;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
            FID
          </div>
          <span className="font-semibold text-lg hidden sm:inline-block">FaceID Attendance</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-1 py-2 font-medium transition-colors duration-300 ${
                location.pathname === link.path
                  ? 'text-primary'
                  : 'text-foreground/80 hover:text-primary'
              }`}
            >
              {location.pathname === link.path && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-full z-[-1]"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 md:hidden rounded-full hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isMenuOpen ? 1 : 0,
            height: isMenuOpen ? 'auto' : 0
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden bg-background/95 backdrop-blur-sm"
        >
          <nav className="flex flex-col py-4 px-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-secondary'
                }`}
              >
                <span>{link.name}</span>
                <ChevronRight size={16} className="opacity-50" />
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
