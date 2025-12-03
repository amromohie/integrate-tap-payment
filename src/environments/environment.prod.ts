/**
 * Production environment configuration
 * IMPORTANT: Never commit actual secrets to version control
 * Use environment variables, CI/CD secrets, or a secrets manager
 */

/**
 * Production environment
 * 
 * IMPORTANT: Replace these placeholder values with actual production values.
 * For CI/CD, use environment variable replacement during build:
 * - Angular CLI: ng build --configuration production
 * - Replace values at build time using your CI/CD pipeline
 * 
 * Example: Use a script to replace these values or use Angular's file replacements
 */
export const environment = {
  production: true,
  
  // Firebase Configuration - Replace with actual production values
  firebase: {
    apiKey: 'REPLACE_WITH_PRODUCTION_FIREBASE_API_KEY',
    authDomain: 'REPLACE_WITH_PRODUCTION_FIREBASE_AUTH_DOMAIN',
    projectId: 'REPLACE_WITH_PRODUCTION_FIREBASE_PROJECT_ID',
    storageBucket: 'REPLACE_WITH_PRODUCTION_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'REPLACE_WITH_PRODUCTION_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'REPLACE_WITH_PRODUCTION_FIREBASE_APP_ID'
  },

  // Tap Payments Configuration
  tapPayments: {
    publishableKey: 'REPLACE_WITH_PRODUCTION_TAP_PUBLISHABLE_KEY'
  },

  // Google Maps API Configuration
  googleMaps: {
    apiKey: 'REPLACE_WITH_PRODUCTION_GOOGLE_MAPS_API_KEY'
  },

  // API Endpoints
  api: {
    baseUrl: 'https://api.example.com' // Replace with your production API URL
  },

  // Security Configuration
  security: {
    // Use strict CSP in production
    cspLevel: 'strict',
    // Enable Trusted Types in production
    enableTrustedTypes: true
  },

  // Development Configuration
  useFakeAuth: false // Always use real Firebase Auth in production
};
