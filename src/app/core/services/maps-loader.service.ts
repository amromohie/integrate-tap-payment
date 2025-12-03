import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MapsLoaderService {
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;

  /**
   * Load Google Maps JavaScript API dynamically
   * @returns Promise that resolves when API is loaded
   */
  load(): Promise<void> {
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    const apiKey = environment.googleMaps.apiKey;
    if (!apiKey) {
      return Promise.reject(new Error('Google Maps API key not configured'));
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // IMPORTANT: Set up callback BEFORE creating script
      // This ensures the callback is available when Google Maps API calls it
      window.initGoogleMaps = () => {
        console.log('Google Maps callback fired');
        
        // Wait a bit to ensure google.maps is fully available
        setTimeout(() => {
          if (window.google?.maps && window.google.maps.Map) {
            console.log('Google Maps API is ready');
            this.isLoaded = true;
            resolve();
          } else {
            console.warn('Google Maps API callback fired but google.maps is not ready yet, polling...');
            // If still not available, check again
            let attempts = 0;
            const maxAttempts = 100; // 5 seconds total (50ms * 100)
            const checkInterval = setInterval(() => {
              attempts++;
              if (window.google?.maps && window.google.maps.Map) {
                console.log('Google Maps API is now ready after', attempts, 'attempts');
                this.isLoaded = true;
                clearInterval(checkInterval);
                resolve();
              } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('Google Maps API structure:', {
                  hasWindowGoogle: !!window.google,
                  hasGoogleMaps: !!window.google?.maps,
                  hasGoogleMapsMap: !!window.google?.maps?.Map,
                  windowGoogle: window.google
                });
                delete window.initGoogleMaps; // Clean up callback
                reject(new Error('Google Maps API loaded but google.maps.Map is not available. Check API key and enabled APIs.'));
              }
            }, 50);
          }
        }, 200); // Increased initial delay
      };

      // Set up global error handler for Google Maps API errors
      const originalOnError: OnErrorEventHandler | null = window.onerror;
      let apiErrorCaught = false;

      window.onerror = (message, source, lineno, colno, error) => {
        // Check if it's a Google Maps related error
        const errorStr = String(message || error?.message || '');
        if (errorStr.includes('ApiNotActivatedMapError') || 
            errorStr.includes('RefererNotAllowedMapError') ||
            errorStr.includes('InvalidKeyMapError') ||
            errorStr.includes('This page didn\'t load Google Maps correctly')) {
          apiErrorCaught = true;
          this.loadPromise = null;
          delete window.initGoogleMaps;
          
          let errorMsg = 'Failed to load Google Maps API.';
          if (errorStr.includes('ApiNotActivatedMapError')) {
            errorMsg = 'Maps JavaScript API is not enabled. Enable it at: https://console.cloud.google.com/google/maps-apis/api-list';
          } else if (errorStr.includes('RefererNotAllowedMapError')) {
            errorMsg = 'API key is not allowed for this domain. Check API restrictions in Google Cloud Console.';
          } else if (errorStr.includes('InvalidKeyMapError')) {
            errorMsg = 'Invalid API key. Check your Google Maps API key configuration.';
          }
          
          reject(new Error(errorMsg));
          
          // Restore original error handler
          if (originalOnError) {
            window.onerror = originalOnError;
          }
          return true; // Prevent default error handling
        }
        
        // Call original error handler for other errors
        if (originalOnError) {
          return originalOnError.call(window, message, source, lineno, colno, error);
        }
        return false;
      };

      // Create script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      
      // Load with Places and Geocoding libraries
      // Note: loading=async is for when using the loader.js, not direct script loading
      // For direct script loading with callback, we don't use loading=async
      // Added 'places' library for PlaceAutocompleteElement web component support
      // IMPORTANT: PlaceAutocompleteElement requires Places library to be loaded
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&callback=initGoogleMaps`;
      
      script.onerror = () => {
        if (!apiErrorCaught) {
          this.loadPromise = null;
          delete window.initGoogleMaps;
          if (originalOnError) {
            window.onerror = originalOnError;
          }
          reject(new Error('Failed to load Google Maps API script. Check browser console for CSP errors, network issues, or API key problems.'));
        }
      };

      // Add timeout to detect if callback never fires
      const timeout = setTimeout(() => {
        if (!this.isLoaded && !apiErrorCaught && this.loadPromise) {
          this.loadPromise = null;
          delete window.initGoogleMaps;
          if (originalOnError) {
            window.onerror = originalOnError;
          }
          reject(new Error('Google Maps API failed to load (timeout). Check if the API is enabled and your API key is valid.'));
        }
      }, 30000); // 30 second timeout

      // Clean up timeout when resolved or rejected
      // Store reference to promise before chaining
      const currentPromise = this.loadPromise;
      if (currentPromise) {
        this.loadPromise = currentPromise.then(
          (value) => {
            clearTimeout(timeout);
            if (originalOnError) {
              window.onerror = originalOnError;
            }
            return value;
          },
          (error) => {
            clearTimeout(timeout);
            if (originalOnError) {
              window.onerror = originalOnError;
            }
            throw error;
          }
        );
      }

      // Append to head
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Check if Google Maps API is loaded
   */
  isLoadedCheck(): boolean {
    return this.isLoaded && !!window.google?.maps && !!window.google.maps.Map;
  }

  /**
   * Get the google.maps object
   */
  getGoogleMaps(): any {
    if (!this.isLoadedCheck()) {
      throw new Error('Google Maps API is not loaded. Call load() first.');
    }
    if (!window.google?.maps) {
      throw new Error('Google Maps API is loaded but google.maps is not available');
    }
    return window.google.maps;
  }
}
