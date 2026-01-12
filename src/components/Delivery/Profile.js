import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, updateUserPassword, validatePassword, validatePasswordStrength } from '../../services/authService';
import { deliveryService, storageService } from '../../services/databaseService';
import { toast } from 'react-toastify';

const Profile = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [deliveryPersonnel, setDeliveryPersonnel] = useState(null);

  // Profile Info State (combines personal and delivery info)
  const [profileForm, setProfileForm] = useState({
    // Personal info (from users collection)
    name: userData?.name || '',
    phone: userData?.phone || '',
    profilePicture: userData?.profilePicture || '',
    // Delivery info (from delivery_personnel collection)
    vehicleType: '',
    vehicleModel: '',
    licensePlate: '',
    licenseNumber: '',
    emergencyContact: '',
    emergencyPhone: ''
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
    loadDeliveryData();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (userData) {
      setProfileForm(prev => ({
        ...prev,
        // Personal info
        name: userData.name || '',
        phone: userData.phone || '',
        profilePicture: userData.profilePicture || ''
      }));
      setPreviewImage(userData.profilePicture || '');
    }
  }, [userData]);

  useEffect(() => {
    if (deliveryPersonnel) {
      setProfileForm(prev => ({
        ...prev,
        // Delivery info
        vehicleType: deliveryPersonnel.vehicleType || '',
        vehicleModel: deliveryPersonnel.vehicleModel || '',
        licensePlate: deliveryPersonnel.licensePlate || '',
        licenseNumber: deliveryPersonnel.licenseNumber || '',
        emergencyContact: deliveryPersonnel.emergencyContact || '',
        emergencyPhone: deliveryPersonnel.emergencyPhone || ''
      }));
    }
  }, [deliveryPersonnel]);

  const loadDeliveryData = async () => {
    if (currentUser?.uid) {
      try {
        const deliveryData = await deliveryService.getById(currentUser.uid);
        setDeliveryPersonnel(deliveryData);
      } catch (error) {
        console.error('Error loading delivery data:', error);
      }
    }
  };

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
    
    try {
      // Update personal info in users collection
      const userUpdateResult = await updateUserProfile(currentUser.uid, {
        name: profileForm.name,
        phone: profileForm.phone,
        profilePicture: profileForm.profilePicture
      });

      // Update delivery info in delivery_personnel collection
      const deliveryUpdateResult = await deliveryService.update(currentUser.uid, {
        vehicleType: profileForm.vehicleType,
        vehicleModel: profileForm.vehicleModel,
        licensePlate: profileForm.licensePlate,
        licenseNumber: profileForm.licenseNumber,
        emergencyContact: profileForm.emergencyContact,
        emergencyPhone: profileForm.emergencyPhone
      });

      if (userUpdateResult.success && deliveryUpdateResult.success) {
        toast.success('Profile updated successfully!');
        loadDeliveryData(); // Reload delivery data
      } else {
        toast.error(userUpdateResult.error || deliveryUpdateResult.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
        <div className="card-header bg-warning text-dark p-4">
          <div className="d-flex align-items-center">
            <div className="position-relative me-4">
              <div className="profile-avatar-wrapper shadow-lg">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="profile-avatar-img rounded-circle" />
                ) : (
                  <div className="profile-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center bg-white text-warning">
                    <i className="fas fa-motorcycle fa-3x"></i>
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
              <h3 className="mb-1 fw-bold">{userData?.name || 'Delivery Driver'}</h3>
              <p className="mb-0 opacity-75">{currentUser?.email}</p>
              <span className="badge bg-dark text-warning mt-2">
                <i className="fas fa-motorcycle me-1"></i>
                Delivery Driver
              </span>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-fill border-0 bg-light p-1">
            <li className="nav-item">
              <button
                className={`nav-link border-0 rounded-pill py-3 transition-all ${activeTab === 'info' ? 'active bg-white shadow-sm text-warning fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('info')}
              >
                <i className="fas fa-user-edit me-2"></i> Profile & Vehicle
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 rounded-pill py-3 transition-all ${activeTab === 'security' ? 'active bg-white shadow-sm text-warning fw-bold' : 'text-muted'}`}
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
                  {/* Personal Information Section */}
                  <div className="col-12">
                    <h5 className="text-warning mb-3">
                      <i className="fas fa-user me-2"></i>
                      Personal Information
                    </h5>
                  </div>
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
                        required
                      />
                    </div>
                  </div>

                  {/* Vehicle Information Section */}
                  <div className="col-12 mt-4">
                    <hr />
                    <h5 className="text-warning mb-3">
                      <i className="fas fa-motorcycle me-2"></i>
                      Vehicle Information
                    </h5>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Vehicle Type</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-car text-muted"></i></span>
                      <select
                        name="vehicleType"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.vehicleType}
                        onChange={handleInfoChange}
                        required
                      >
                        <option value="">Select vehicle type</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="car">Car</option>
                        <option value="scooter">Scooter</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Vehicle Model</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-cogs text-muted"></i></span>
                      <input
                        type="text"
                        name="vehicleModel"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.vehicleModel}
                        onChange={handleInfoChange}
                        placeholder="e.g., Honda CB125, Toyota Corolla"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">License Plate</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-id-card text-muted"></i></span>
                      <input
                        type="text"
                        name="licensePlate"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.licensePlate}
                        onChange={handleInfoChange}
                        placeholder="Vehicle license plate number"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Driver's License Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-id-badge text-muted"></i></span>
                      <input
                        type="text"
                        name="licenseNumber"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.licenseNumber}
                        onChange={handleInfoChange}
                        placeholder="Your driver's license number"
                        required
                      />
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div className="col-12 mt-4">
                    <hr />
                    <h5 className="text-warning mb-3">
                      <i className="fas fa-phone-alt me-2"></i>
                      Emergency Contact
                    </h5>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Emergency Contact Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-user-friends text-muted"></i></span>
                      <input
                        type="text"
                        name="emergencyContact"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.emergencyContact}
                        onChange={handleInfoChange}
                        placeholder="Emergency contact person"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Emergency Contact Phone</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="fas fa-phone-alt text-muted"></i></span>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        className="form-control bg-light border-0 py-2"
                        value={profileForm.emergencyPhone}
                        onChange={handleInfoChange}
                        placeholder="+251 ..."
                      />
                    </div>
                  </div>
                  <div className="col-12 pt-2">
                    <button type="submit" className="btn btn-warning px-5 py-2 rounded-pill shadow-sm text-dark fw-bold" disabled={loading}>
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