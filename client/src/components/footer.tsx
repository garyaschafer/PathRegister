import { Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="library-footer py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Register Path</h3>
            <p className="text-gray-300 mb-6">
              Streamlining event registration and management for library events, workshops, and community gatherings. 
              Making community engagement simple and accessible for everyone.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#events" className="text-gray-300 hover:text-white transition-colors">Browse Events</a></li>
              <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#help" className="text-gray-300 hover:text-white transition-colors">Help & Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">For Organizers</h4>
            <ul className="space-y-2">
              <li><a href="/admin" className="text-gray-300 hover:text-white transition-colors">Admin Login</a></li>
              <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#api" className="text-gray-300 hover:text-white transition-colors">API Documentation</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2024 Register Path. All rights reserved. Built for public libraries with ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
