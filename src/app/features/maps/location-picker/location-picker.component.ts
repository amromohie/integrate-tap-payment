import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MapsLoaderService } from '../../../core/services/maps-loader.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { SanitizationService } from '../../../core/services/sanitization.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * MIGRATION: TypeScript interface for PlaceAutocompleteElement web component
 * This replaces the old Autocomplete type definitions
 */
declare global {
  interface HTMLElementTagNameMap {
    'gmp-place-autocomplete': any;
  }
}

export interface SavedLocation {
  id?: string;
  userId: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  createdAt?: Date;
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Required for web components like <gmp-place-autocomplete>
  templateUrl: './location-picker.component.html',
  styleUrl: './location-picker.component.css'
})
export class LocationPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  // MIGRATION: Changed from HTMLInputElement to gmp-place-autocomplete web component
  // OLD: @ViewChild('autocompleteInput', { static: false }) autocompleteInput!: ElementRef<HTMLInputElement>;
  @ViewChild('placeAutocomplete', { static: false }) placeAutocomplete!: ElementRef<any>;

  private readonly mapsLoaderService = inject(MapsLoaderService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly userStoreService = inject(UserStoreService);
  private readonly sanitizationService = inject(SanitizationService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  locationForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    address: [''],
    latitude: [null, Validators.required],
    longitude: [null, Validators.required]
  });

  private map: any = null;
  private marker: any = null;
  // MIGRATION: Removed old Autocomplete instance - using web component instead
  // OLD: private autocomplete: any = null;
  private geocoder: any = null;
  private placesService: any = null;

  ngOnInit(): void {
    // Load Google Maps API early
    this.loadGoogleMaps();
  }

  ngAfterViewInit(): void {
    // Wait a tick to ensure ViewChild references are available
    setTimeout(() => {
      // Always try to load, it will return resolved promise if already loaded
      console.log('ngAfterViewInit - loading Google Maps...');
      this.mapsLoaderService.load().then(() => {
        // Wait for DOM and API to be fully ready
        setTimeout(() => {
          console.log('Google Maps load promise resolved, attempting to initialize map...');
          this.initializeMap();
        }, 200);
      }).catch((error) => {
        console.error('Error loading Google Maps:', error);
        this.errorMessage.set('Failed to load Google Maps. Please check your API key and console for errors.');
        this.isLoading.set(false);
      });
    }, 200);
  }

  ngOnDestroy(): void {
    // MIGRATION: Cleanup PlaceAutocompleteElement event listener
    // OLD: No cleanup needed for Autocomplete (removed with input)
    // NEW: Remove event listener to prevent memory leaks
    if (this.placeAutocomplete?.nativeElement) {
      const element = this.placeAutocomplete.nativeElement as any;
      if (element._placeChangeHandler) {
        element.removeEventListener('gmpx-placechange', element._placeChangeHandler);
        delete element._placeChangeHandler;
      }
    }
    // Cleanup if needed
  }

  private async loadGoogleMaps(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.mapsLoaderService.load();
      // Map initialization will happen in ngAfterViewInit
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      this.errorMessage.set('Failed to load Google Maps. Please check your API key.');
      this.isLoading.set(false);
    }
  }

  private initializeMap(): void {
    // Ensure map container is available
    if (!this.mapContainer?.nativeElement) {
      console.warn('Map container not available yet, retrying...');
      setTimeout(() => this.initializeMap(), 100);
      return;
    }

    // Check if map is already initialized
    if (this.map) {
      return;
    }

    // Ensure Google Maps API is fully loaded
    if (!this.mapsLoaderService.isLoadedCheck() || !window.google?.maps || !window.google.maps.Map) {
      console.warn('Google Maps API not fully loaded yet, retrying...', {
        isLoadedCheck: this.mapsLoaderService.isLoadedCheck(),
        hasWindowGoogle: !!window.google,
        hasGoogleMaps: !!window.google?.maps,
        hasGoogleMapsMap: !!window.google?.maps?.Map
      });
      setTimeout(() => this.initializeMap(), 300);
      return;
    }

    try {
      console.log('Initializing map - checking API availability...');
      console.log('window.google exists:', !!window.google);
      console.log('window.google.maps exists:', !!window.google?.maps);
      console.log('window.google.maps.Map exists:', !!window.google?.maps?.Map);
      
      // getGoogleMaps() returns window.google.maps directly, not window.google
      const googleMaps = this.mapsLoaderService.getGoogleMaps();
      
      console.log('getGoogleMaps() returned:', !!googleMaps);
      console.log('googleMaps.Map exists:', !!googleMaps?.Map);
      
      // googleMaps IS window.google.maps, so we check googleMaps.Map directly
      if (!googleMaps || !googleMaps.Map) {
        console.error('Google Maps API structure:', {
          googleMaps: googleMaps,
          googleMapsMap: googleMaps?.Map,
          windowGoogle: window.google,
          windowGoogleMaps: window.google?.maps
        });
        throw new Error('Google Maps API is not properly initialized. Check console for details.');
      }
      
      // Ensure container has dimensions
      const container = this.mapContainer.nativeElement;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Map container has no dimensions, retrying...');
        setTimeout(() => this.initializeMap(), 200);
        return;
      }

      // Initialize map (googleMaps IS the maps object, so use it directly)
      try {
        this.map = new googleMaps.Map(container, {
          center: { lat: 24.7136, lng: 46.6753 }, // Default to Riyadh, Saudi Arabia
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });

        // Listen for map errors (e.g., ApiNotActivatedMapError)
        // Google Maps fires 'error' event when API is not enabled
        this.map.addListener('error', (error: any) => {
          console.error('Google Maps map error event:', error);
          let errorMsg = 'Map error occurred. Please check console for details.';
          
          const errorStr = String(error || '');
          if (errorStr.includes('ApiNotActivatedMapError') || error === 'ApiNotActivatedMapError') {
            errorMsg = '⚠️ Maps JavaScript API is not enabled for this API key.\n\nEnable it at: https://console.cloud.google.com/google/maps-apis/api-list\n\nAlso enable:\n- Places API\n- Geocoding API';
          } else if (errorStr.includes('RefererNotAllowedMapError') || error === 'RefererNotAllowedMapError') {
            errorMsg = '⚠️ API key is not allowed for this domain.\n\nAdd your domain in Google Cloud Console → APIs & Services → Credentials → API restrictions.';
          } else if (errorStr.includes('InvalidKeyMapError') || error === 'InvalidKeyMapError') {
            errorMsg = '⚠️ Invalid API key.\n\nCheck your Google Maps API key in environment configuration.';
          }
          
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
        });

        // Also listen for tilesloaded to detect if map actually loaded
        this.map.addListener('tilesloaded', () => {
          console.log('Map tiles loaded successfully');
          this.errorMessage.set(null); // Clear any previous errors
        });
      } catch (mapError: any) {
        console.error('Error creating map instance:', mapError);
        const errorStr = String(mapError?.message || mapError || '');
        let errorMsg = 'Failed to create map.';
        
        if (errorStr.includes('ApiNotActivatedMapError')) {
          errorMsg = '⚠️ Maps JavaScript API is not enabled.\n\nEnable it at: https://console.cloud.google.com/google/maps-apis/api-list\n\nAlso enable Places API and Geocoding API.';
        } else if (errorStr.includes('RefererNotAllowedMapError')) {
          errorMsg = '⚠️ API key is not allowed for this domain. Check API restrictions.';
        } else if (errorStr.includes('InvalidKeyMapError')) {
          errorMsg = '⚠️ Invalid API key. Check your configuration.';
        } else {
          errorMsg = 'Failed to create map: ' + (mapError?.message || mapError);
        }
        
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
        return;
      }

      // Initialize geocoder (googleMaps is already window.google.maps)
      this.geocoder = new googleMaps.Geocoder();

      // MIGRATION: Initialize PlaceAutocompleteElement web component
      // OLD CODE REMOVED:
      //   this.autocomplete = new googleMaps.places.Autocomplete(
      //     this.autocompleteInput.nativeElement,
      //     { types: ['address'], fields: ['geometry', 'formatted_address', 'name'] }
      //   );
      //   this.autocomplete.addListener('place_changed', () => { this.onPlaceSelected(); });
      // 
      // NEW: Using web component with 'gmpx-placechange' event
      // Wait for Places library to be fully ready before initializing
      if (googleMaps.places && googleMaps.places.PlacesService) {
        this.initializePlaceAutocomplete();
      } else {
        // Retry after a short delay if Places library isn't ready
        setTimeout(() => {
          if (googleMaps.places && googleMaps.places.PlacesService) {
            this.initializePlaceAutocomplete();
          } else {
            console.warn('Places library not available, autocomplete may not work');
          }
        }, 500);
      }

      // Click listener on map
      this.map.addListener('click', (event: any) => {
        this.handleMapClick(event.latLng);
      });

      this.isLoading.set(false);
      console.log('Google Maps initialized successfully');
    } catch (error: any) {
      console.error('Error initializing map:', error);
      
      // Check for specific API errors
      if (error?.message?.includes('ApiNotActivatedMapError') || error === 'ApiNotActivatedMapError') {
        this.errorMessage.set('Maps JavaScript API is not enabled for this API key. Please enable it in Google Cloud Console: https://console.cloud.google.com/google/maps-apis');
      } else {
        this.errorMessage.set('Failed to initialize map. Please refresh the page. Error: ' + (error?.message || error));
      }
      this.isLoading.set(false);
    }
  }

  /**
   * MIGRATION: Initialize PlaceAutocompleteElement web component
   * This replaces the old Autocomplete API initialization
   * OLD: Used google.maps.places.Autocomplete with input element
   * NEW: Uses <gmp-place-autocomplete> web component with 'gmpx-placechange' event
   * OWASP: Safe initialization - no inline scripts, uses Angular event binding
   */
  private initializePlaceAutocomplete(): void {
    if (!this.placeAutocomplete?.nativeElement) {
      console.warn('PlaceAutocompleteElement not available yet, will retry...');
      setTimeout(() => this.initializePlaceAutocomplete(), 200);
      return;
    }

    const element = this.placeAutocomplete.nativeElement;

    // Ensure Google Maps API and Places library are fully loaded
    const googleMaps = this.mapsLoaderService.getGoogleMaps();
    if (!googleMaps?.places?.PlacesService) {
      console.warn('Places library not ready, retrying PlaceAutocompleteElement initialization...');
      setTimeout(() => this.initializePlaceAutocomplete(), 300);
      return;
    }

    // Ensure custom element is defined (web component must be registered)
    // The PlaceAutocompleteElement is registered when Google Maps API loads with places library
    if (!customElements.get('gmp-place-autocomplete')) {
      console.warn('PlaceAutocompleteElement custom element not registered yet, retrying...');
      setTimeout(() => this.initializePlaceAutocomplete(), 300);
      return;
    }

    // Wait for the element to be fully upgraded/initialized by the browser
    // PlaceAutocompleteElement automatically initializes when Google Maps API is loaded
    // Give it a moment to fully initialize
    setTimeout(() => {
      // MIGRATION: Listen to 'gmpx-placechange' event instead of 'place_changed'
      // OLD: this.autocomplete.addListener('place_changed', () => { this.onPlaceSelected(); });
      // NEW: element.addEventListener('gmpx-placechange', (event) => { ... });
      // The event detail contains the place object directly
      // OWASP: Using addEventListener with sanitized callback (no inline handlers)
      const handlePlaceChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.place) {
          this.onPlaceSelected(customEvent.detail.place);
        } else {
          console.warn('PlaceAutocompleteElement event missing place data', customEvent.detail);
        }
      };

      element.addEventListener('gmpx-placechange', handlePlaceChange);

      // Store handler reference for cleanup if needed
      (element as any)._placeChangeHandler = handlePlaceChange;

      console.log('PlaceAutocompleteElement initialized successfully');
    }, 200);
  }

  /**
   * MIGRATION: Updated to accept place as parameter from event detail
   * OLD: private onPlaceSelected(): void { const place = this.autocomplete.getPlace(); }
   * NEW: Receives place directly from event.detail.place
   * 
   * @param place - Google Maps Place object from PlaceAutocompleteElement event
   */
  private onPlaceSelected(place: any): void {
    // OWASP: Input validation - check for required geometry
    if (!place?.geometry) {
      this.errorMessage.set('Please select a valid location from the suggestions.');
      return;
    }

    // OWASP: Sanitize user input before displaying or processing
    // Sanitize address before displaying
    const address = this.sanitizationService.sanitizeHtml(
      place.formatted_address || place.name || ''
    ).toString();

    // TypeScript typing for coordinates
    interface PlaceCoordinates {
      lat: () => number;
      lng: () => number;
    }

    const location: PlaceCoordinates = place.geometry.location;

    // Move map to selected place (maintains existing map integration)
    if (place.geometry.viewport) {
      this.map.fitBounds(place.geometry.viewport);
    } else {
      this.map.setCenter(location);
      this.map.setZoom(17);
    }

    // Update marker (maintains existing marker functionality)
    const lat = location.lat();
    const lng = location.lng();
    this.setMarker(lat, lng);
    
    // Update form with sanitized data
    this.locationForm.patchValue({
      address: address,
      latitude: lat,
      longitude: lng
    });
  }

  private handleMapClick(latLng: any): void {
    const lat = latLng.lat();
    const lng = latLng.lng();

    this.setMarker(lat, lng);
    
    // Reverse geocode to get address
    this.reverseGeocode(lat, lng);
    
    // Update form
    this.locationForm.patchValue({
      latitude: lat,
      longitude: lng
    });
  }

  private setMarker(lat: number, lng: number): void {
    const googleMaps = this.mapsLoaderService.getGoogleMaps();

    if (this.marker) {
      this.marker.setPosition({ lat, lng });
    } else {
      this.marker = new googleMaps.Marker({
        position: { lat, lng },
        map: this.map,
        draggable: true
      });

      // Update position when marker is dragged
      this.marker.addListener('dragend', (event: any) => {
        const position = event.latLng;
        this.locationForm.patchValue({
          latitude: position.lat(),
          longitude: position.lng()
        });
        this.reverseGeocode(position.lat(), position.lng());
      });
    }

    this.map.setCenter({ lat, lng });
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        // Sanitize address
        const address = this.sanitizationService.sanitizeHtml(results[0].formatted_address).toString();
        this.locationForm.patchValue({
          address: address
        });
      }
    });
  }

  onSubmit(): void {
    if (this.locationForm.invalid) {
      return;
    }

    const userId = this.userStoreService.user()?.uid;
    if (!userId) {
      this.errorMessage.set('User not authenticated');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.locationForm.value;
    const location: SavedLocation = {
      userId,
      name: formValue.name,
      address: formValue.address,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      createdAt: new Date()
    };

    // Sanitize name and address before saving
    location.name = this.sanitizationService.sanitizeHtml(location.name || '').toString();
    location.address = this.sanitizationService.sanitizeHtml(location.address || '').toString();

    this.firestoreService.setDocument(`locations/${Date.now()}-${userId}`, location).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Location saved successfully!');
        this.locationForm.reset();
        
        // Remove marker
        if (this.marker) {
          this.marker.setMap(null);
          this.marker = null;
        }
      },
      error: (error) => {
        console.error('Error saving location:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Failed to save location. Please try again.');
      }
    });
  }

  get name() {
    return this.locationForm.get('name');
  }

  get latitude() {
    return this.locationForm.get('latitude');
  }

  get longitude() {
    return this.locationForm.get('longitude');
  }
}
