import React, { useState } from 'react';

const TrackingBar = ({ activeStep = 0 }) => {
    const [hoveredStep, setHoveredStep] = useState(null);
    const [clickedStep, setClickedStep] = useState(null);

    const steps = [
        {
            icon: 'fas fa-search',
            label: 'Choose Restaurant',
            description: 'Browse through our wide selection of restaurants and cuisines in your area',
            color: '#3498db',
            bgColor: '#e3f2fd'
        },
        {
            icon: 'fas fa-utensils',
            label: 'Select Food',
            description: 'Pick your favorite dishes from the menu and customize your order',
            color: '#e74c3c',
            bgColor: '#ffebee'
        },
        {
            icon: 'fas fa-credit-card',
            label: 'Make Payment',
            description: 'Securely pay for your order using various payment methods',
            color: '#f39c12',
            bgColor: '#fff3e0'
        },
        {
            icon: 'fas fa-truck',
            label: 'Track & Receive',
            description: 'Track your order in real-time and receive it at your doorstep',
            color: '#2ecc71',
            bgColor: '#e8f5e9'
        }
    ];

    const handleMouseEnter = (index) => {
        setHoveredStep(index);
    };

    const handleMouseLeave = () => {
        setHoveredStep(null);
    };

    const handleClick = (index) => {
        setClickedStep(clickedStep === index ? null : index);
    };

    const isStepActive = (index) => {
        return hoveredStep === index || clickedStep === index;
    };

    return (
        <div className="row tracking-bar mb-5">
            {steps.map((step, index) => (
                <div
                    key={index}
                    className={`col-md-3 tracking-step ${index <= activeStep ? 'active' : ''} ${hoveredStep === index ? 'tracking-step-hovered' : ''}`}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(index)}
                >
                    <div 
                        className="step-icon"
                        style={{
                            background: hoveredStep === index ? step.color : (index <= activeStep ? 'var(--gradient)' : '#f1f1f1'),
                            color: hoveredStep === index || index <= activeStep ? '#fff' : step.color,
                            borderColor: hoveredStep === index ? step.color : (index <= activeStep ? 'var(--primary)' : '#eee')
                        }}
                    >
                        <i className={step.icon}></i>
                    </div>
                    {index < steps.length - 1 && <div className="step-line"></div>}
                    <h6 style={{ color: hoveredStep === index ? step.color : 'inherit' }}>{step.label}</h6>
                    {isStepActive(index) && (
                        <div 
                            className="step-description"
                            style={{
                                borderColor: step.color,
                                background: step.bgColor
                            }}
                        >
                            {step.description}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TrackingBar;
