// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// This is a functional interceptor, denoted by HttpInterceptorFn
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService); // Inject services using `inject()`
  const router = inject(Router);

  const token = authService.getToken();

  // Clone the request and add the Authorization header if a token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle errors, specifically 401 Unauthorized or 403 Forbidden
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.warn('Authentication error (401/403). Redirecting to login...');
        authService.logout(); // Clear token
        router.navigate(['/signin_signup']); // Redirect to sign-in page
      }
      return throwError(() => error); // Re-throw the error for component-specific handling
    })
  );
};
