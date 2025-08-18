
# DOPE Network - Frontend

A modern social media platform built with React that connects communities worldwide. This is the frontend application for the DOPE Network platform.

## 🌟 Features

- **Social Networking**: Create posts, follow users, and engage with content
- **Real-time Feed**: Dynamic "For You" and "Following" feeds
- **User Profiles**: Customizable profiles with analytics
- **Search & Discovery**: Find posts and users across the platform
- **Media Support**: Image uploads with HEIC conversion support
- **Subscription System**: Free, Premium, and Pro tiers with different features
- **Security**: Firebase App Check integration for API protection
- **Analytics**: Comprehensive user engagement analytics
- **Responsive Design**: Mobile-first design with Bootstrap

## 🚀 Tech Stack

- **Frontend**: React 19.1.1 with React Router
- **UI Framework**: React Bootstrap with Bootstrap Icons
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Media Storage**: Cloudinary
- **Security**: Firebase App Check with reCAPTCHA
- **Analytics**: Vercel Analytics & Speed Insights
- **Build Tool**: Create React App

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Cloudinary account for media uploads
- DOPE Network API backend

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Firebase App Check
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN=your_debug_token

# API Configuration
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
```

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dopp/dopp-social.git
   cd dopp-social
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase and API configuration

4. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── assets/           # Static assets (images, CSS)
├── components/       # Reusable React components
│   ├── banners/     # Banner components
│   ├── dialogs/     # Modal dialogs
│   ├── navs/        # Navigation components
│   └── stepper/     # Multi-step form components
├── config/          # Configuration files
│   ├── ApiConfig.js      # API client configuration
│   ├── CloudinaryConfig.js # Media upload config
│   └── FirebaseConfig.js   # Firebase initialization
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   ├── HomePage.jsx      # Main feed page
│   ├── ProfilePage.jsx   # User profile page
│   ├── AnalyticsPage.jsx # User analytics
│   └── ...
├── router/          # Routing configuration
│   ├── loader/      # Route data loaders
│   ├── security/    # Authentication guards
│   └── AppRouter.jsx     # Main router
├── utils/           # Utility functions
│   ├── app-check-utils.js    # Firebase App Check
│   ├── app-utils.js          # General utilities
│   ├── firestore-utils.js    # Firestore helpers
│   └── ...
└── index.js         # Application entry point
```

## 🔐 Authentication & Security

The application uses Firebase Authentication with the following features:

- Email/password authentication
- Email verification required
- Protected routes with authentication guards
- Firebase App Check for API security
- Secure token management

## 📊 Analytics

Built-in analytics tracking includes:

- Post engagement metrics (likes, comments, shares)
- User growth statistics
- Content performance analysis
- Page view tracking via Vercel Analytics

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Bootstrap
- **Dark/Light Theme**: Consistent theming throughout
- **Loading States**: Smooth loading experiences
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG compliant components

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
```

### Deploy to Replit
1. Import the repository to Replit
2. Configure environment variables in Replit Secrets
3. Use Replit's deployment features for hosting

## 📦 Key Dependencies

- `react` & `react-dom` - Core React framework
- `react-router-dom` - Client-side routing
- `react-bootstrap` - UI components
- `firebase` - Authentication and database
- `@vercel/analytics` - Analytics tracking
- `heic2any` - Image format conversion
- `md5` - Hashing utilities
- `animate.css` - CSS animations

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://www.dopp.eu.org/](https://www.dopp.eu.org/)
- **API Documentation**: Contact the development team
- **Support**: [rexluciano@yahoo.com](mailto:rexluciano@yahoo.com)

## 👥 Authors

- **Rex Luciano** - [rexluciano@yahoo.com](mailto:rexluciano@yahoo.com)

---

**DOPE Network** - Discover something new and connect with others across the world.
