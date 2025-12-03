/**
 * Content Security Policy Configuration
 * 
 * For production, CSP should be set via HTTP headers on the server.
 * This file provides CSP configuration constants that can be used
 * to generate server-side CSP headers.
 * 
 * Meta tag CSP (in index.html) is less secure than HTTP headers
 * and should be considered a fallback.
 */

export const CSP_CONFIG = {
  // Default source
  defaultSrc: ["'self'"],
  
  // Script sources
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Tap SDK and some Angular features - minimize use
    'https://tap-sdks.b-cdn.net',
    'https://*.tap.company',
    'https://*.googleapis.com',
    'https://*.gstatic.com',
    'https://www.googletagmanager.com'
  ],
  
  // Style sources
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for TailwindCSS and component styles
    'https://fonts.googleapis.com'
  ],
  
  // Font sources
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  
  // Image sources
  imgSrc: [
    "'self'",
    'data:',
    'https:',
    'blob:'
  ],
  
  // Connect sources (XHR, fetch, WebSocket)
  connectSrc: [
    "'self'",
    'https://*.firebaseapp.com',
    'https://*.googleapis.com',
    'https://*.gstatic.com',
    'https://*.tap.company',
    'https://sdk.tap.company',
    'https://sdk.beta.tap.company',
    'https://*.firebaseio.com',
    'wss://*.firebaseio.com'
  ],
  
  // Frame sources (iframes)
  frameSrc: [
    "'self'",
    'https://*.tap.company',
    'https://*.googleapis.com'
  ],
  
  // Object sources (plugins)
  objectSrc: ["'none'"],
  
  // Base URI
  baseUri: ["'self'"],
  
  // Form action
  formAction: ["'self'"],
  
  // Upgrade insecure requests
  upgradeInsecureRequests: true
};

/**
 * Generate CSP header value from configuration
 */
export function generateCSPHeader(): string {
  const directives: string[] = [];
  
  if (CSP_CONFIG.defaultSrc.length > 0) {
    directives.push(`default-src ${CSP_CONFIG.defaultSrc.join(' ')}`);
  }
  if (CSP_CONFIG.scriptSrc.length > 0) {
    directives.push(`script-src ${CSP_CONFIG.scriptSrc.join(' ')}`);
  }
  if (CSP_CONFIG.styleSrc.length > 0) {
    directives.push(`style-src ${CSP_CONFIG.styleSrc.join(' ')}`);
  }
  if (CSP_CONFIG.fontSrc.length > 0) {
    directives.push(`font-src ${CSP_CONFIG.fontSrc.join(' ')}`);
  }
  if (CSP_CONFIG.imgSrc.length > 0) {
    directives.push(`img-src ${CSP_CONFIG.imgSrc.join(' ')}`);
  }
  if (CSP_CONFIG.connectSrc.length > 0) {
    directives.push(`connect-src ${CSP_CONFIG.connectSrc.join(' ')}`);
  }
  if (CSP_CONFIG.frameSrc.length > 0) {
    directives.push(`frame-src ${CSP_CONFIG.frameSrc.join(' ')}`);
  }
  if (CSP_CONFIG.objectSrc.length > 0) {
    directives.push(`object-src ${CSP_CONFIG.objectSrc.join(' ')}`);
  }
  if (CSP_CONFIG.baseUri.length > 0) {
    directives.push(`base-uri ${CSP_CONFIG.baseUri.join(' ')}`);
  }
  if (CSP_CONFIG.formAction.length > 0) {
    directives.push(`form-action ${CSP_CONFIG.formAction.join(' ')}`);
  }
  if (CSP_CONFIG.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
}
