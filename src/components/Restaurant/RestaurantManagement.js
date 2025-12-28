import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { restaurantService, menuService } from '../../services/databaseService';

const RestaurantManagement = () => {
  const { currentUser, userData } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    deliveryTime: '',
    image: ''
  });

  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true
  });

  useEffect(() => {
    loadRestaurantData();
  }, [currentUser]);

  const loadRestaurantData = async () => {
    if (!currentUser) return;
    
    try {
      // Load restaurant info
      const restaurantData = await restaurantService.getById(currentUser.uid);
      if (restaurantData) {
        setRestaurant(restaurantData);
        setRestaurantForm(restaurantData);
        
        // Load menu items
        const items = await menuService.getByRestaurant(currentUser.uid);
        setMenuItems(items);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await restaurantService.update(currentUser.uid, restaurantForm);
      if (result.success) {
        toast.success('Restaurant information updated successfully!');
        setRestaurant({ ...restaurant, ...restaurantForm });
      } else {
        toast.error(result.error || 'Failed to update restaurant');
      }
    } catch (error) {
      toast.error('An error occurred while updating restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (editingItem) {
        // Update existing item
        result = await menuService.update(editingItem.id, menuForm);
        if (result.success) {
          toast.success('Menu item updated successfully!');
          setMenuItems(menuItems.map(item => 
            item.id === editingItem.id ? { ...item, ...menuForm } : item
          ));
        }
      } else {
        // Add new item
        result = await menuService.add(currentUser.uid, menuForm);
        if (result.success) {
          toast.success('Menu item added successfully!');
          const newItem = { id: result.id, ...menuForm };
          setMenuItems([...menuItems, newItem]);
        }
      }

      if (result.success) {
        setShowAddItem(false);
        setEditingItem(null);
        setMenuForm({
          name: '',
          description: '',
          price: '',
          category: '',
          image: '',
          isAvailable: true
        });
      } else {
        toast.error(result.error || 'Failed to save menu item');
      }
    } catch (error) {
      toast.error('An error occurred while saving menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const result = await menuService.delete(itemId);
      if (result.success) {
        toast.success('Menu item deleted successfully!');
        setMenuItems(menuItems.filter(item => item.id !== itemId));
      } else {
        toast.error(result.error || 'Failed to delete menu item');
      }
    } catch (error) {
      toast.error('An error occurred while deleting menu item');
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      isAvailable: item.isAvailable
    });
    setShowAddItem(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Restaurant Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-store me-2"></i>
                Restaurant Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleRestaurantSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Restaurant Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={restaurantForm.name}
                        onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Cuisine Type *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={restaurantForm.cuisine}
                        onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                        placeholder="e.g., Italian, Ethiopian, Fast Food"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={restaurantForm.description}
                    onChange={(e) => setRestaurantForm({...restaurantForm, description: e.target.value})}
                    placeholder="Describe your restaurant..."
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={restaurantForm.address}
                        onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={restaurantForm.phone}
                        onChange={(e) => setRestaurantForm({...restaurantForm, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Delivery Time</label>
                      <input
                        type="text"
                        className="form-control"
                        value={restaurantForm.deliveryTime}
                        onChange={(e) => setRestaurantForm({...restaurantForm, deliveryTime: e.target.value})}
                        placeholder="e.g., 30-45 min"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Restaurant Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={restaurantForm.image}
                        onChange={(e) => setRestaurantForm({...restaurantForm, image: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <i className="fas fa-save me-2"></i>
                  Update Restaurant Information
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Management */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-utensils me-2"></i>
                Menu Items ({menuItems.length})
              </h5>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowAddItem(true);
                  setEditingItem(null);
                  setMenuForm({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    image: '',
                    isAvailable: true
                  });
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add Menu Item
              </button>
            </div>
            <div className="card-body">
              {/* Add/Edit Menu Item Form */}
              {showAddItem && (
                <div className="border rounded p-3 mb-4 bg-light">
                  <h6>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h6>
                  <form onSubmit={handleMenuSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Item Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={menuForm.name}
                            onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Price (ETB) *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={menuForm.price}
                            onChange={(e) => setMenuForm({...menuForm, price: parseFloat(e.target.value)})}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={menuForm.description}
                        onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                        placeholder="Describe the item..."
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Category *</label>
                          <select
                            className="form-select"
                            value={menuForm.category}
                            onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="appetizers">Appetizers</option>
                            <option value="main-course">Main Course</option>
                            <option value="burgers">Burgers</option>
                            <option value="pizza">Pizza</option>
                            <option value="ethiopian">Ethiopian</option>
                            <option value="coffee">Coffee & Drinks</option>
                            <option value="desserts">Desserts</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Image URL</label>
                          <input
                            type="url"
                            className="form-control"
                            value={menuForm.image}
                            onChange={(e) => setMenuForm({...menuForm, image: e.target.value})}
                            placeholder="https://example.com/food-image.jpg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={menuForm.isAvailable}
                          onChange={(e) => setMenuForm({...menuForm, isAvailable: e.target.checked})}
                        />
                        <label className="form-check-label">
                          Available for order
                        </label>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-success" disabled={loading}>
                        <i className="fas fa-save me-2"></i>
                        {editingItem ? 'Update Item' : 'Add Item'}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddItem(false);
                          setEditingItem(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Menu Items List */}
              {menuItems.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-utensils fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No menu items yet</h5>
                  <p className="text-muted">Add your first menu item to get started!</p>
                </div>
              ) : (
                <div className="row">
                  {menuItems.map((item) => (
                    <div key={item.id} className="col-md-6 col-lg-4 mb-3">
                      <div className="card h-100">
                        {item.image && (
                          <img 
                            src={item.image} 
                            className="card-img-top" 
                            alt={item.name}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title mb-0">{item.name}</h6>
                            <span className={`badge ${item.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <p className="card-text text-muted small">{item.description}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="h6 text-primary mb-0">{item.price} ETB</span>
                            <span className="badge bg-light text-dark">{item.category}</span>
                          </div>
                        </div>
                        <div className="card-footer bg-transparent">
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-primary flex-fill"
                              onClick={() => startEdit(item)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger flex-fill"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantManagement;