import React from 'react';
import { categories } from '../../data/categories';

const CategoriesSection = () => {
    return (
        <section className="py-5 bg-light">
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title">Popular Categories</h2>
                    <a href="#" className="text-primary">View All</a>
                </div>
                <div className="row g-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="col-md-2 col-6 text-center">
                            <div className="category-badge">
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
