import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Card from '../components/Card';
import Button from '../components/Button';

const LandingPage = () => {
  const { user } = useSelector(state => state.user);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-6xl font-bold mb-6 text-gray-800 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Prompt-ionary</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your intelligent companion for storing, translating, and organizing AI prompts. 
            Build your personal collection with smart categorization and seamless multi-language support.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {user ? (
              <Link to="/entries">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg min-w-[180px] rounded-lg shadow-lg hover:shadow-xl transition-all">
                  Go to My Entries
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg min-w-[160px] rounded-lg shadow-lg hover:shadow-xl transition-all">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg min-w-[160px] rounded-lg transition-all">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-blue-600 text-2xl">📝</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Store & Organize</h3>
            <p className="text-gray-600 leading-relaxed">
              Save and categorize your AI prompts with intelligent organization. Never lose a brilliant prompt again.
            </p>
          </Card>
          
          <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-green-600 text-2xl">🌍</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Multi-Language</h3>
            <p className="text-gray-600 leading-relaxed">
              Seamlessly translate your prompts between languages with our built-in AI translation engine.
            </p>
          </Card>

          <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-white">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-purple-600 text-2xl">📚</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Smart Categories</h3>
            <p className="text-gray-600 leading-relaxed">
              Organize prompts with intelligent categorization for lightning-fast discovery and management.
            </p>
          </Card>
        </div>

        {/* Tier Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8 border-2 border-gray-200 hover:border-gray-300 transition-all">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Free Tier</h3>
              <div className="text-4xl font-bold text-gray-600 mb-4">Free</div>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center justify-center">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                  Up to 20 entries
                </li>
                <li className="flex items-center justify-center">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                  Basic categorization
                </li>
                <li className="flex items-center justify-center">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                  Translation support
                </li>
              </ul>
              {!user && (
                <Link to="/register">
                  <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg">
                    Start Free
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          <Card className="p-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300 transition-all">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-800 mb-4">Premium Tier</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">IDR 50,000</div>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center justify-center">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                  Unlimited entries
                </li>
                <li className="flex items-center justify-center">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                  Advanced AI features
                </li>
                <li className="flex items-center justify-center">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                  Priority support
                </li>
              </ul>
              {user ? (
                <Link to="/transactions">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                    Upgrade Now
                  </Button>
                </Link>
              ) : (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg opacity-75">
                  Sign Up to Upgrade
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        {!user && (
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to organize your prompts?
            </h2>
            <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
              Join thousands of users who have transformed their AI prompt workflow with Prompt-ionary.
            </p>
            <Link to="/register">
              <Button className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all">
                Start Your Journey Today
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
