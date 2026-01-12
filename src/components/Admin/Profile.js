import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, updateUserPassword, validatePassword, validatePasswordStrength } from '../../services/authService';
import { storageService } from '../../services/databaseService';
import { toast } from 'react-toastify';

const Profile = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Profile Info State
  const [profileForm, setProfileForm] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    profilePicture: userData?.profilePicture || ''
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [previewImage, setPreviewImage] = useState(profileForm.profilePicture);

  useEffect(() => {
    if (userData) {
      setProfileForm({
        name: userData.name || '',
        phone: userData.phone || '',
        profilePicture: userData.profilePicture || ''
      });
      setPreviewImage(userData.profilePicture || '');
    }
  }, [userData]);

  const handleInfoChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    
    // Validate password strength in real-time for new password
    if (name === 'newPassword') {
      if (value) {
        const strength = validatePasswordStrength(value);
        setPasswordStrength(strength);
        
        // Update password errors
        const errors = [];
        if (!strength.criteria.minLength) errors.push('At least 8 characters');
        if (!strength.criteria.hasUpperCase) errors.push('One uppercase letter');
        if (!strength.criteria.hasLowerCase) errors.push('One lowercase letter');
        if (!strength.criteria.hasNumbers) errors.push('One number');
        if (!strength.criteria.hasSpecialChar) errors.push('One special character');
        setPasswordErrors(errors);
      } else {
        setPasswordStrength(null);
        setPasswordErrors([]);
      }
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const result = await storageService.uploadImage(file, `users/${currentUser.uid}/profile`);
        if (result.success) {
          setPreviewImage(result.url);
          setProfileForm({ ...profileForm, profilePicture: result.url });
          toast.success('Profile picture uploaded! Save changes to apply.');
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error('Failed to upload image');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateUserProfile(currentUser.uid, profileForm);
    if (result.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!passwordForm.currentPassword.trim()) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (!passwordForm.newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (!passwordForm.confirmPassword.trim()) {
      toast.error('Please confirm your new password');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    // Validate password strength
    const validation = validatePassword(passwordForm.newPassword);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }
    
    // Check if new password is different from current
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength(null);
        setPasswordErrors([]);
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container fade-in">
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-danger text-white p-4">
          <div className="d-flex align-items-center">
            <div className="position-relative me-4">
              <div className="profile-avatar-wrapper shadow-lg">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="profile-avatar-img rounded-circle" />
                ) : (
                  <div className="profile-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center bg-white text-danger">
                    <i className="fas fa-user-shield fa-3x"></i>
                  </div>
                )}
                <label htmlFor="profilePicInput" className="profile-avatar-edit-btn shadow">
                  <i className="fas fa-camera"></i>
                  <input
                    type="file"
                    id="profilePicInput"
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
            <div>
              <h3 className="mb-1 fw-bold">{userData?.name || 'Admin Profile'}</h3>
              <p className="mb-0 opacity-75">{currentUser?.email}</p>
              <span className="badge bg-light text-danger mt-2">
                <i className="fas fa-user-shield me-1"></i>
                Administrator
              </span>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-fill border-0 bg-light p-1">
            <li className="nav-item">
              <button
                className={`nav-link border-0 rounded-pill py-3 transition-all ${activeTab === 'info' ? 'active bg-white shadow-sm text-danger fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('info')}
              >
                <i className="fas fa-user-edit me-2"></i> Personal Info
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 rounded-pill py-3 transition-all ${activeTab === 'security' ? 'active bg-white shadow-sm text-danger fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-shield-alt me-2"></i> Security
              </button>
            </li>
          </ul>

          <div className="p-4">
            {activeTab === 'info' ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-user text-muted"></i></span>
                      <input
                        type="text"
                        name="name"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.name}
                        onChange={handleInfoChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-phone text-muted"></i></span>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.phone}
                        onChange={handleInfoChange}
                        placeholder="+251 ..."
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      As an administrator, you have full access to manage users, orders, and platform settings.
                    </div>
                  </div>
                  <div className="col-12 pt-2">
                    <button type="submit" className="btn btn-danger px-5 py-2 rounded-pill shadow-sm" disabled={loading}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <div className="row g-4">
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Current Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-key text-muted"></i></span>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        className="form-control bg-light border-0 py-2"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                        required
                      />
                      <button
                        className="btn btn-light border-0"
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        <i className={`fas fa-eye${showCurrentPassword ? '-slash' : ''} text-muted`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">New Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-lock text-muted"></i></span>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        className="form-control bg-light border-0 py-2"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Must be at least 8 characters"
                        required
                      />
                      <button
                        className="btn btn-light border-0"
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        <i className={`fas fa-eye${showNewPassword ? '-slash' : ''} text-muted`}></i>
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center mb-1">
                          <small className="text-muted me-2">Password strength:</small>
                          <span 
                            className="badge" 
                            style={{ backgroundColor: passwordStrength.color }}
                          >
                            {passwordStrength.strength.toUpperCase()}
                          </span>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${(passwordStrength.score / 5) * 100}%`,
                              backgroundColor: passwordStrength.color 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {/* Password Requirements */}
                    {passwordForm.newPassword && passwordErrors.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted d-block mb-1">Password must include:</small>
                        {passwordErrors.map((error, index) => (
                          <small key={index} className="text-danger d-block">
                            <i className="fas fa-times me-1"></i>{error}
                          </small>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Confirm New Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-check-double text-muted"></i></span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        className="form-control bg-light border-0 py-2"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Repeat new password"
                        required
                      />
                      <button
                        className="btn btn-light border-0"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''} text-muted`}></i>
                      </button>
                    </div>
                    {/* Password Match Indicator */}
                    {passwordForm.confirmPassword && (
                      <div className="mt-2">
                        {passwordForm.newPassword === passwordForm.confirmPassword ? (
                          <small className="text-success">
                            <i className="fas fa-check me-1"></i>Passwords match
                          </small>
                        ) : (
                          <small className="text-danger">
                            <i className="fas fa-times me-1"></i>Passwords do not match
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-12 pt-2">
                    <button 
                      type="submit" 
                      className="btn btn-dark px-5 py-2 rounded-pill shadow-sm" 
                      disabled={
                        loading || 
                        !passwordForm.currentPassword || 
                        !passwordForm.newPassword || 
                        !passwordForm.confirmPassword ||
                        passwordForm.newPassword !== passwordForm.confirmPassword ||
                        (passwordStrength && !passwordStrength.isValid)
                      }
                    >
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                      ) : 'Change Password'}
                    </button>
                    {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <div className="mt-2">
                        <small className="text-danger">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Please ensure passwords match before submitting
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .profile-avatar-wrapper {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          position: relative;
          border: 4px solid white;
        }
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
        }
        .profile-avatar-edit-btn {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 32px;
          height: 32px;
          background: #ffc107;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #212529;
          cursor: pointer;
          transition: all 0.2s;
        }
        .profile-avatar-edit-btn:hover {
          transform: scale(1.1);
          background: #ffca2c;
        }
        .nav-tabs .nav-link.active {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default Profile;