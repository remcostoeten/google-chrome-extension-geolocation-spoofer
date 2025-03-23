
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Globe, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 border-t border-border mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Location Tracker</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <a 
              href="https://github.com/remcostoeten" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github size={16} />
              <span>Remco Stoeten</span>
            </a>
            
            <a 
              href="#" 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Globe size={16} />
              <span>Chrome Geolocation Spoofer</span>
            </a>
            
            <Link 
              to="/privacy-policy" 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Shield size={16} />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
