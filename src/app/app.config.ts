// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Import withInterceptors

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor'; // Corrected: Import as authInterceptor (lowercase 'a')

export const appConfig: ApplicationConfig = {
  providers: [
    // Provide HttpClient with the AuthInterceptor
    provideHttpClient(withInterceptors([authInterceptor])), // Corrected: Use authInterceptor
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Provide routing using the routes defined in app.routes.ts
    provideRouter(routes),
    provideClientHydration(withEventReplay())
  ]
};
