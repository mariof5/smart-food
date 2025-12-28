# SmartFood Project Structure

## 📁 Complete File Organization

```
SmartFood/
├── index.html                  # Landing/Home page
├── customer.html               # Customer dashboard
├── restaurant.html             # Restaurant dashboard  
├── admin.html                  # Admin dashboard
├── delivery.html               # Delivery dashboard
│
├── css/
│   ├── common.css             # Shared styles (navbar, footer, etc.)
│   ├── home.css               # Home page specific styles
│   ├── customer.css           # Customer dashboard styles
│   ├── restaurant.css         # Restaurant dashboard styles
│   ├── admin.css              # Admin dashboard styles
│   └── delivery.css           # Delivery dashboard styles
│
├── js/
│   ├── common.js              # Shared utility functions
│   ├── auth.js                # Authentication logic
│   ├── customer.js            # Customer dashboard functions
│   ├── restaurant.js          # Restaurant dashboard functions
│   ├── admin.js               # Admin dashboard functions
│   └── delivery.js            # Delivery dashboard functions
│
├── data/
│   └── sample-data.js         # Sample data and initialization
│
└── docs/
    ├── README.md              # Project documentation
    ├── SETUP.md               # Setup instructions
    └── API.md                 # API documentation (future)
```

## 🎯 File Purposes

### HTML Files:
- **index.html**: Landing page with restaurant listings and features
- **customer.html**: Customer dashboard for ordering food
- **restaurant.html**: Restaurant dashboard for managing orders
- **admin.html**: Admin dashboard for platform management
- **delivery.html**: Delivery personnel dashboard

### CSS Files:
- **common.css**: Shared styles (navbar, footer, buttons, cards)
- **home.css**: Hero section, categories, features
- **customer.css**: Order flow, cart, checkout
- **restaurant.css**: Order management, menu management
- **admin.css**: Analytics, tables, management views
- **delivery.css**: Delivery tracking, task management

### JavaScript Files:
- **common.js**: Utility functions, notifications, helpers
- **auth.js**: Login/logout, session management
- **customer.js**: Order placement, cart management
- **restaurant.js**: Order updates, menu management
- **admin.js**: Platform management, analytics
- **delivery.js**: Delivery tracking, status updates

### Data Files:
- **sample-data.js**: Initial data, localStorage management

## 🚀 How to Use

1. Open `index.html` in browser
2. Navigate to different dashboards via sign-in
3. All data persists in localStorage
4. No backend required for demo

## 📝 Notes

- All files are standalone and can be opened directly
- Bootstrap 5 and Font Awesome loaded via CDN
- Responsive design works on all devices
- Sample data pre-loaded for testing
z