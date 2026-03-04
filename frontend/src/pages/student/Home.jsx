import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Send, Phone, Loader2, AlertCircle } from 'lucide-react';
import { studentAPI } from '../../services/api';

const Home = () => {
  const [stats, setStats] = useState({ total: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await studentAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({ total: 0, resolved: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  const resolvedPercent =
  stats.total > 0
    ? Math.round((stats.resolved / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Speak Up. Be Heard.
              <br />
              <span className="text-primary-200">Help Make Campus Better.</span>
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-8">
              Your identity is never collected or stored. Share your thoughts, 
              raise concerns, and suggest improvements — completely anonymously.
            </p>
            <Link to="/submit" className="btn-primary bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4 inline-flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Submit Your Suggestion
            </Link>
          </div>
        </div>
        
        {/* Wave */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full h-16 text-gray-50" viewBox="0 0 1440 64" fill="currentColor">
            <path d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,42.7C840,43,960,53,1080,53.3C1200,53,1320,43,1380,37.3L1440,32L1440,64L1380,64C1320,64,1200,64,1080,64C960,64,840,64,720,64C600,64,480,64,360,64C240,64,120,64,60,64L0,64Z" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stats.total}</div>
                <div className="text-gray-600">Total Suggestions</div>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{resolvedPercent}%</div>
                <div className="text-gray-600">Issues Resolved</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Submit Your Feedback', description: 'Share your thoughts, concerns, or ideas using our simple form.' },
              { step: '02', title: 'Stay Anonymous', description: 'Your identity is never collected. Speak freely without worry.' },
              { step: '03', title: 'See Changes', description: 'Your feedback helps improve the university for everyone.' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-6xl font-bold text-primary-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Need Immediate Help?</h3>
              <p className="text-gray-600 mb-2">For urgent matters requiring immediate attention, contact staff directly:</p>
              <a href="tel:+256793702186" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold">
                <Phone className="w-5 h-5 mr-2" />
                +256 793 702 186
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;