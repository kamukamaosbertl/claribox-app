import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">About ClariBox</h3>
            <p className="text-gray-400">
              Your voice matters. ClariBox provides a safe and anonymous way to share 
              your thoughts, raise concerns, and suggest improvements that can make 
              your university better.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/submit" className="hover:text-white transition-colors">Submit Feedback</a></li>
              <li><a href="/suggestions" className="hover:text-white transition-colors">View Suggestions</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Staff</a></li>
              <li><a href="/help" className="hover:text-white transition-colors">Help & FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Contact Staff</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-primary-500" />
                <span>+256 306 099 876</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-primary-500" />
                <span>support@must.ac.ug</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                <span>Main Administration Block</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} ClariBox. Your feedback is completely anonymous.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;