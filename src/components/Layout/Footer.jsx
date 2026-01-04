import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    <div className="col-md-4 mb-4">
                        <h4 className="mb-4"><i className="fas fa-utensils me-2"></i> Food Express</h4>
                        <p>Food Express Ordering & Scheduled Delivery Application for Ethiopia. Order food anytime, anywhere
                            with real-time tracking.</p>
                        <div className="d-flex">
                            <a href="#" className="text-white me-3"><i className="fab fa-facebook-f fa-lg"></i></a>
                            <a href="#" className="text-white me-3"><i className="fab fa-twitter fa-lg"></i></a>
                            <a href="#" className="text-white me-3"><i className="fab fa-instagram fa-lg"></i></a>
                            <a href="#" className="text-white"><i className="fab fa-linkedin-in fa-lg"></i></a>
                        </div>
                    </div>
                    <div className="col-md-2 mb-4">
                        <h5 className="mb-4">Quick Links</h5>
                        <ul className="list-unstyled">
                            <li className="mb-2"><Link to="/" className="text-white text-decoration-none">Home</Link></li>
                            <li className="mb-2"><a href="#restaurants" className="text-white text-decoration-none">Restaurants</a></li>
                            <li className="mb-2"><a href="#how-it-works" className="text-white text-decoration-none">How It Works</a></li>
                        </ul>
                    </div>
                    <div className="col-md-3 mb-4">
                        <h5 className="mb-4">Cities</h5>
                        <ul className="list-unstyled">
                            <li className="mb-2"><a href="#" className="text-white text-decoration-none">Addis Ababa</a></li>
                            <li className="mb-2"><a href="#" className="text-white text-decoration-none">Dire Dawa</a></li>
                            <li className="mb-2"><a href="#" className="text-white text-decoration-none">Hawassa</a></li>
                            <li className="mb-2"><a href="#" className="text-white text-decoration-none">Bahir Dar</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Mekelle</a></li>
                        </ul>
                    </div>
                    <div className="col-md-3 mb-4">
                        <h5 className="mb-4">Download Our App</h5>
                        <p>Get the best experience with our mobile app</p>
                        <div className="d-flex">
                            <a href="#" className="me-2">
                                <img src="https://via.placeholder.com/120x40/555/fff?text=App+Store" alt="App Store"
                                    className="img-fluid" />
                            </a>
                            <a href="#">
                                <img src="https://via.placeholder.com/120x40/555/fff?text=Google+Play" alt="Google Play"
                                    className="img-fluid" />
                            </a>
                        </div>
                    </div>
                </div>
                <hr className="my-4 bg-light" />
                <div className="row">
                    <div className="col-md-6">
                        <p>&copy; 2025 Online Food Ordering & Scheduled Delivery System. All rights reserved.</p>
                    </div>
                    <div className="col-md-6 text-md-end">
                        <p>Developed by Amde Worku, Akal Belete, Kidus H/Mariam</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
