# React Router v6 Application

A complete React application demonstrating React Router v6 with modal functionality, responsive design, and modern React patterns.

## Features

- ✅ **React Router v6** - Modern routing with clean URLs
- ✅ **Modal Components** - Reusable modal that can display any page
- ✅ **Responsive Design** - Works on all device sizes
- ✅ **404 Fallback** - Custom 404 page for unknown routes
- ✅ **Navigation** - Active link highlighting
- ✅ **Functional Components** - Using React hooks (useState, useEffect)
- ✅ **Accessibility** - Keyboard navigation and ARIA labels

## Routes

- `/` - Home page
- `/about` - About page
- `/profile` - Profile page with modal functionality
- `*` - 404 fallback page

## Key Components

### Modal Component
The `Modal` component is reusable and can display any content:
- Centered on screen
- Closable with X button, Escape key, or backdrop click
- Prevents body scroll when open
- Smooth animations

### Navigation
- Active link highlighting based on current route
- Responsive design for mobile devices
- Clean, modern styling

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## BrowserRouter vs HashRouter

The application uses `BrowserRouter` by default, which provides clean URLs like `/about`. 

If your server doesn't support client-side routing, switch to `HashRouter` in `src/index.jsx`:

```jsx
// Change from:
import { BrowserRouter } from 'react-router-dom';

// To:
import { HashRouter } from 'react-router-dom';

// And update the component:
<HashRouter>
  <App />
</HashRouter>
```

HashRouter uses URLs like `/#/about` instead of `/about`.

## Project Structure

```
src/
├── components/
│   ├── Modal.jsx          # Reusable modal component
│   ├── Modal.css
│   ├── Navigation.jsx     # Navigation component
│   └── Navigation.css
├── pages/
│   ├── Home.jsx          # Home page
│   ├── Home.css
│   ├── About.jsx         # About page
│   ├── About.css
│   ├── Profile.jsx       # Profile page with modal
│   ├── Profile.css
│   ├── NotFound.jsx      # 404 page
│   └── NotFound.css
├── App.jsx               # Main app component with routes
├── App.css              # Global app styles
├── index.jsx            # Entry point with router setup
└── index.css            # Global styles
```

## Usage Examples

### Opening a Modal
```jsx
import React, { useState } from 'react';
import Modal from '../components/Modal';
import About from '../pages/About';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Open About in Modal
      </button>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="About Us"
      >
        <About />
      </Modal>
    </>
  );
};
```

### Navigation
```jsx
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav>
      <Link 
        to="/about" 
        className={location.pathname === '/about' ? 'active' : ''}
      >
        About
      </Link>
    </nav>
  );
};
```

## Styling

The application uses CSS modules and modern CSS features:
- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming
- Responsive design with mobile-first approach
- Smooth animations and transitions
- Accessibility-focused styling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code in your own projects!
