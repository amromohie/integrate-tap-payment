# Secure Angular 21 Application

A comprehensive, OWASP-hardened Angular 21 application with Firebase Authentication, Firestore, Tap Payments SDK v2, and Google Maps integration.

## Tech Stack

- **Angular 21** - Latest Angular with standalone components
- **TailwindCSS** - Utility-first CSS framework
- **Firebase** - Authentication and Firestore database
- **Tap Payments SDK v2** - Secure card tokenization
- **Google Maps JavaScript API** - Maps with Places and Geocoding
- **TypeScript** - Strict mode enabled

## Features

### Authentication
- Email/password authentication
- Google Sign-In integration
- Protected routes with guards
- User profile management

### Payments
- Tap Payments card tokenization
- Secure card input via Tap SDK (iframe-based)
- Save payment tokens to Firestore (only token ID, no sensitive data)
- List and manage saved payment methods

### Maps
- Interactive Google Maps integration
- Places Autocomplete for address search
- Reverse geocoding
- Save locations to Firestore

### Security Features
- Content Security Policy (CSP) implementation
- Security headers (X-Content-Type-Options, Referrer-Policy, etc.)
- HTTP interceptors for security and authentication
- Input sanitization with DOMPurify patterns
- Firestore security rules enforcing user ownership
- No sensitive data stored in frontend/localStorage
- Production build optimizations (no source maps)

## Prerequisites

- Node.js 18+ and npm
- Firebase project (for Auth and Firestore)
- Tap Payments account (for publishable key)
- Google Maps API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create environment configuration files:

**`src/environments/environment.ts`** (development):
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    // ... other Firebase config
  },
  tapPayments: {
    publishableKey: 'pk_test_UELxO3TYtsAFVMyzwQWcjr7G'
  },
  googleMaps: {
    apiKey: 'your-google-maps-api-key'
  }
};
```

**`src/environments/environment.prod.ts`** (production):
Use environment variables or CI/CD secrets:
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: process.env['NG_APP_FIREBASE_API_KEY'] || '',
    // ... other config from env vars
  },
  // ...
};
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google Sign-In (configure OAuth consent screen)
3. Create Firestore database:
   - Go to Firestore Database
   - Create database in production mode
   - Deploy security rules: `firebase deploy --only firestore:rules`
4. Get Firebase config from Project Settings

### 4. Tap Payments Setup

1. Sign up at [Tap Payments](https://www.tap.company/)
2. Get your publishable key from the dashboard
3. Update `environment.ts` with your publishable key
4. Use test key for development: `pk_test_UELxO3TYtsAFVMyzwQWcjr7G`

### 5. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key
5. Restrict the API key to your domain (production)
6. Update `environment.ts` with your API key

### 6. Deploy Firestore Security Rules

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
```

### 7. Run Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`

### 8. Build for Production

```bash
npm run build --configuration production
```

## Security Checklist

### Frontend Security

- ✅ Content Security Policy (CSP) meta tag implemented
- ✅ Security headers configured (X-Content-Type-Options, Referrer-Policy, etc.)
- ✅ HTTP interceptors for security headers
- ✅ Input sanitization for user-generated content
- ✅ XSS protection via sanitization service
- ✅ No sensitive data in localStorage
- ✅ Production builds disable source maps
- ✅ TypeScript strict mode enabled
- ✅ Input validation on all forms
- ✅ Rate limiting utilities (debounce/throttle)

### Firebase Security

- ✅ Firestore security rules enforce user ownership
- ✅ Authentication required for all data access
- ✅ Payment tokens validated (no sensitive card data stored)
- ✅ Location data validated (coordinates within valid ranges)

### Server/Deployment Security

- ⚠️ **Set CSP via HTTP headers** (meta tag is fallback)
- ⚠️ **Enable HTTPS/HSTS** on your hosting provider
- ⚠️ **Configure security headers** on server:
  - `Content-Security-Policy` (use CSP_CONFIG from `core/security/csp.config.ts`)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- ⚠️ **Remove inline script allowances** in production CSP
- ⚠️ **Restrict API keys** to your domain
- ⚠️ **Enable Firebase App Check** for additional protection

### Recommended Server Configuration

If using Firebase Hosting, see `firebase.json` for header configuration.

For other hosting providers (Nginx, Apache, etc.), configure headers accordingly.

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards (auth, role)
│   ├── interceptors/    # HTTP interceptors
│   ├── security/        # CSP config, Trusted Types
│   └── services/        # Core services (auth, firestore, etc.)
├── features/
│   ├── auth/            # Login, register components
│   ├── payments/        # Payment form and list
│   └── maps/            # Location picker
└── shared/
    ├── components/      # Reusable components
    ├── pipes/           # Custom pipes
    └── utils/           # Validators, utilities
```

## Development Commands

```bash
# Development server
npm start

# Production build
npm run build

# Run tests
npm test

# Firebase emulators (local testing)
firebase emulators:start

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Important Security Notes

1. **Never commit secrets** - Use environment variables or secrets manager
2. **CSP in Production** - Set CSP via HTTP headers, not just meta tag
3. **API Key Restrictions** - Restrict Google Maps and Firebase API keys to your domain
4. **Firestore Rules** - Regularly review and test security rules
5. **HTTPS Required** - Always use HTTPS in production
6. **Regular Updates** - Keep dependencies updated for security patches

## OWASP Top 10 Mitigations

- **A01: Broken Access Control** - Firestore rules enforce user ownership
- **A02: Cryptographic Failures** - HTTPS required, no sensitive data stored
- **A03: Injection** - Input sanitization, CSP, parameterized queries
- **A04: Insecure Design** - Security-first architecture, least privilege
- **A05: Security Misconfiguration** - Production build optimizations, secure headers
- **A06: Vulnerable Components** - Regular dependency updates
- **A07: Authentication Failures** - Firebase Auth, secure session management
- **A08: Software and Data Integrity** - Input validation, sanitization
- **A09: Logging and Monitoring** - Error logging (implement backend monitoring)
- **A10: Server-Side Request Forgery** - Validate and sanitize external URLs

## License

This project is provided as-is for educational and development purposes.

## Support

For issues related to:
- **Firebase**: [Firebase Documentation](https://firebase.google.com/docs)
- **Tap Payments**: [Tap Payments Documentation](https://developers.tap.company/docs/card-sdk-web)
- **Google Maps**: [Google Maps Documentation](https://developers.google.com/maps/documentation)

## Additional Resources

- [Angular Security Guide](https://angular.io/guide/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)