import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <h1 className="text-2xl font-bold text-primary">Register Path</h1>
              <span className="ml-2 text-sm text-muted-foreground">Library Events</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={`library-nav-link ${location === '/' ? 'text-primary' : ''}`}>
              Events
            </Link>
            <a href="#about" className="library-nav-link">About</a>
            <a href="#contact" className="library-nav-link">Contact</a>
            <Link href="/admin">
              <Button className="library-button" data-testid="button-admin">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </nav>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="library-nav-link py-2">
                Events
              </Link>
              <a href="#about" className="library-nav-link py-2">About</a>
              <a href="#contact" className="library-nav-link py-2">Contact</a>
              <Link href="/admin">
                <Button className="library-button justify-start" data-testid="button-admin-mobile">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
