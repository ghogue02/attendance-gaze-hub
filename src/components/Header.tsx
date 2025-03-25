import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ChevronRight, Home, LayoutDashboard } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

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
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
  ];

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled 
      ? 'py-2 bg-white/90 backdrop-blur-md shadow-sm' 
      : 'py-4 bg-gradient-to-r from-primary/10 to-purple-500/10'
  }`;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-sm">
            PS
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-foreground leading-tight hidden sm:inline-block">
              Pursuit System
            </span>
            <span className="text-xs text-foreground/70 hidden sm:inline-block">
              Attendance Tracker
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => (
            <Button
              key={link.path}
              variant={location.pathname === link.path ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              asChild
            >
              <Link to={link.path}>
                {link.icon}
                {link.name}
              </Link>
            </Button>
          ))}
        </nav>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 md:hidden rounded-full hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

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
          <nav className="flex flex-col py-4 px-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-secondary'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
                <ChevronRight size={16} className="ml-auto opacity-50" />
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
