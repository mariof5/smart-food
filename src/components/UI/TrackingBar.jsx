import React from 'react';

const TrackingBar = ({ activeStep = 0 }) => {
    const steps = [
        { icon: 'fas fa-search', label: 'Choose Restaurant' },
        { icon: 'fas fa-utensils', label: 'Select Food' },
        { icon: 'fas fa-credit-card', label: 'Make Payment' },
        { icon: 'fas fa-truck', label: 'Track & Receive' }
    ];

    return (
        <div className="row tracking-bar mb-5">
            {steps.map((step, index) => (
                <div key={index} className={`col-md-3 tracking-step ${index <= activeStep ? 'active' : ''}`}>
                    <div className="step-icon">
                        <i className={step.icon}></i>
                    </div>
                    {index < steps.length - 1 && <div className="step-line"></div>}
                    <h6>{step.label}</h6>
                </div>
            ))}
        </div>
    );
};

export default TrackingBar;
