/**
 * Development environment configuration
 * DO NOT commit actual secrets to version control
 * Use environment variables or a secrets manager for production
 */

export const environment = {
  production: false,

  // Firebase Configuration
  // Replace with your Firebase project config from Firebase Console
  firebase: {
    apiKey: 'your-api-key-here',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id'
  },

  // Tap Payments Configuration
  // Test key provided - replace with your own for production
  tapPayments: {
    publishableKey: 'pk_test_UELxO3TYtsAFVMyzwQWcjr7G'
  },

  // Google Maps API Configuration
  googleMaps: {
    apiKey: 'AIzaSyCjwb8ZX7cYBHwrpPtXgnNesPNWWOTy_1c'
  },

  // API Endpoints
  api: {
    baseUrl: 'http://localhost:3000/api'
  },

  // Security Configuration
  security: {
    // CSP strictness level: 'strict' | 'moderate' | 'relaxed'
    cspLevel: 'moderate',
    // Enable Trusted Types
    enableTrustedTypes: false
  },

  // Development Configuration
  useFakeAuth: true // Set to false to use real Firebase Auth
};
