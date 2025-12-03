import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, Injector } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFirebaseApp, initializeApp, FirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { securityInterceptor } from './core/interceptors/security.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(), // Enable zoneless change detection
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        securityInterceptor,
        authInterceptor,
        errorInterceptor
      ])
    ),
    // Firebase providers - order matters: app first, then auth and firestore
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth((injector: Injector) => {
      const app = injector.get(FirebaseApp);
      return getAuth(app);
    }),
    provideFirestore((injector: Injector) => {
      const app = injector.get(FirebaseApp);
      return getFirestore(app);
    })
  ]
};
