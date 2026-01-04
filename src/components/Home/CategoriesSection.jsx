import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { categories } from '../../data/categories';
import { toast } from 'react-toastify';

const CategoriesSection = ({ selectedCategory, setSelectedCategory }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleCategoryClick = (categoryId) => {
        if (!currentUser) {
            toast.info('Please sign up to browse popular categories');
            navigate('/register');
            return;
        }

        if (selectedCategory === categoryId) {
            setSelectedCategory(null); // Deselect if already selected
        } else {
            setSelectedCategory(categoryId);
        }
    };
    return (
        <section className="py-5 bg-light">
            <div className="container">
                <div className="mb-4">
                    <h2 className="section-title">Popular Categories</h2>
                </div>
                <div className="row g-4 scroll-container">
                    {categories.map((cat) => (
                        <div key={cat.id} className="col-auto">
                            <div
                                className={`category-badge ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(cat.id)}
                            >
                                <i className={`${cat.icon} me-2`}></i> {cat.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoriesSection;
