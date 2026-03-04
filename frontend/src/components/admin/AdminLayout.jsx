import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Shield, User, LogOut, Settings, Camera } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../../services/api';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profilePicture: null
  });
  const navigate = useNavigate();

  // Fetch admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await adminAPI.getProfile();
        const adminData = response.data;
        setAdmin(adminData);
        setFormData({
          name: adminData.name || 'Admin',
          email: adminData.email || 'admin@school.edu',
          profilePicture: adminData.profilePicture || null
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Set default values if API fails
        setFormData({
          name: 'Admin',
          email: 'admin@school.edu',
          profilePicture: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.updateProfile(formData);
      setAdmin(response.data);
      setIsEditing(false);
      setProfileOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formDataWithPicture = new FormData();
      formDataWithPicture.append('profilePicture', file);
      formDataWithPicture.append('name', formData.name);
      formDataWithPicture.append('email', formData.email);

      const response = await adminAPI.updateProfile(formDataWithPicture);
      setAdmin(response.data);
      setFormData({
        ...formData,
        profilePicture: response.data.profilePicture
      });
    } catch (error) {
      console.error('Error uploading picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold">ClariBox Admin</span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-gray-800 rounded-lg relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-800 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-30">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search feedback, categories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                  {admin?.profilePicture ? (
                    <img 
                      src={admin.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-semibold">
                      {loading ? '...' : getInitials(formData.name)}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {loading ? 'Loading...' : formData.name}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => {
                      setProfileOpen(false);
                      setIsEditing(false);
                    }}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                    {/* Profile Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {isEditing ? 'Edit Profile' : 'Admin Profile'}
                        </h3>
                        <button 
                          onClick={() => {
                            setProfileOpen(false);
                            setIsEditing(false);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>

                      {!isEditing ? (
                        // View Mode
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden relative group">
                              {admin?.profilePicture ? (
                                <img 
                                  src={admin.profilePicture} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-primary-600 font-bold text-xl">
                                  {getInitials(formData.name)}
                                </span>
                              )}
                              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="w-5 h-5 text-white" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePictureUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{formData.name}</p>
                              <p className="text-sm text-gray-500">{formData.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                          >
                            Edit Profile
                          </button>
                        </div>
                      ) : (
                        // Edit Mode
                        <form onSubmit={handleProfileUpdate} className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500">Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Menu Options */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;