import React from 'react';
import Navbar from './Layout/Navbar';
import Footer from './Layout/Footer';
import HeroSection from './Home/HeroSection';
import CategoriesSection from './Home/CategoriesSection';
import RestaurantsSection from './Home/RestaurantsSection';
import FeaturesSection from './Home/FeaturesSection';
import HowItWorks from './Home/HowItWorks';

const HomePage = () => {
    const [selectedCategory, setSelectedCategory] = React.useState(null);

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1">
                <HeroSection />
                <CategoriesSection
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />
                <RestaurantsSection
                    selectedCategory={selectedCategory}
                />
                <FeaturesSection />
                <HowItWorks />
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;
