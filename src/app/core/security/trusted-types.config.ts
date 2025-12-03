/**
 * Trusted Types Configuration
 * 
 * Trusted Types is a browser API that helps prevent DOM-based XSS attacks
 * by requiring certain DOM operations to use explicitly whitelisted types.
 * 
 * This is an advanced security feature. Enable only if you can properly
 * configure your application to use Trusted Types.
 * 
 * Usage in production:
 * 1. Enable Trusted Types in environment.prod.ts (security.enableTrustedTypes = true)
 * 2. Configure your application to create Trusted Types policies
 * 3. Update DOM manipulation code to use Trusted Types
 * 
 * For more information: https://web.dev/trusted-types/
 */

// Type declaration for Trusted Types API
interface TrustedTypePolicyOptions {
  createHTML?: (input: string) => string;
  createScript?: (input: string) => string;
  createScriptURL?: (input: string) => string;
}

interface TrustedTypePolicy {
  name: string;
}

declare global {
  interface Window {
    trustedTypes?: {
      createPolicy(name: string, policy: TrustedTypePolicyOptions): TrustedTypePolicy;
    };
  }
}

/**
 * Initialize Trusted Types if enabled
 * Should be called in main.ts if environment.security.enableTrustedTypes is true
 */
export function initializeTrustedTypes(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Check if Trusted Types is supported
  if (!window.trustedTypes || !window.trustedTypes.createPolicy) {
    console.warn('Trusted Types is not supported in this browser');
    return;
  }

  try {
    // Create a default policy for safe HTML
    window.trustedTypes.createPolicy('default', {
      createHTML: (string: string) => {
        // Sanitize HTML using DOMPurify or similar
        // For now, return as-is (should be sanitized)
        return string;
      },
      createScript: (string: string) => {
        // Only allow specific script patterns
        // Reject anything suspicious
        if (string.includes('eval') || string.includes('Function')) {
          throw new Error('Unsafe script detected');
        }
        return string;
      },
      createScriptURL: (url: string) => {
        // Only allow specific URL patterns
        const allowedPatterns = [
          /^https:\/\/tap-sdks\.b-cdn\.net/,
          /^https:\/\/maps\.googleapis\.com/,
          /^https:\/\/.*\.googleapis\.com/
        ];
        
        const isAllowed = allowedPatterns.some(pattern => pattern.test(url));
        if (!isAllowed) {
          throw new Error(`Untrusted script URL: ${url}`);
        }
        return url;
      }
    });

    console.log('Trusted Types initialized');
  } catch (error) {
    console.error('Failed to initialize Trusted Types:', error);
  }
}
