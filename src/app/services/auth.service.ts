import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Import isPlatformBrowser
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

// IMPORTANT: Import your models from the correct path
import { SignInRequest, SignInResponse, SignUpRequest, MessageResponse, ResetPasswordRequest } from '../models/auth.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'jwtToken';
  private apiUrl = 'http://localhost:8089/api/auth'; // Base URL for your auth API

  // BehaviorSubject to hold and broadcast the current login status
  // It's initialized in the constructor after PLATFORM_ID is available.
  private _isLoggedIn$: BehaviorSubject<boolean>;
  isLoggedIn$: Observable<boolean>; // Public observable for other components to subscribe to

  private _currentUserAutoId: number | null = null;
  private _currentUserRoles: string[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID to detect browser vs. server
  ) {
    // Initialize _isLoggedIn$ here, after platformId is available
    this._isLoggedIn$ = new BehaviorSubject<boolean>(this.hasTokenInLocalStorage());
    this.isLoggedIn$ = this._isLoggedIn$.asObservable(); // Assign the public observable

    // Load user details from localStorage if available (after _isLoggedIn$ is set up)
    this.loadUserFromLocalStorage();
  }

  /**
   * Safely checks if a token exists in localStorage, considering the platform.
   * @returns True if a token exists in browser localStorage, false otherwise.
   */
  private hasTokenInLocalStorage(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem(this.TOKEN_KEY);
    }
    return false; // If not in browser, localStorage is not available
  }

  /**
   * Attempts to load user details from localStorage on service initialization.
   * Updates internal state and notifies subscribers.
   */
  private loadUserFromLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // If not in a browser, user cannot be logged in via localStorage
      this._isLoggedIn$.next(false);
      return;
    }

    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedEmail = localStorage.getItem('userEmail');
    const storedRoles = localStorage.getItem('userRoles');

    if (storedToken && storedEmail && storedRoles) {
      // In a real app, you'd decode the JWT or hit a /me endpoint to validate
      this._currentUserAutoId = 101; // Placeholder: Replace with actual logic
      this._currentUserRoles = JSON.parse(storedRoles);
      this._isLoggedIn$.next(true); // Notify that user is logged in
      console.log('AuthService: Restored user from localStorage. Logged in.');
    } else {
      // If data is incomplete, ensure logged out state
      this.logout(false); // Do not navigate during initial load
    }
  }

  /**
   * Handles user sign-in. Stores JWT and user info in localStorage upon success.
   * @param signInData The sign-in credentials (email, password).
   * @returns An Observable of the SignInResponse.
   */
  signIn(signInData: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.apiUrl}/login`, signInData).pipe(
      tap(response => {
        if (response && response.jwtToken) {
          if (isPlatformBrowser(this.platformId)) { // Only access localStorage in browser
            localStorage.setItem(this.TOKEN_KEY, response.jwtToken);
            localStorage.setItem('userEmail', response.email);
            localStorage.setItem('userRoles', JSON.stringify(response.roles));
          }

          this._currentUserAutoId = 101; // Placeholder
          this._currentUserRoles = response.roles;

          this._isLoggedIn$.next(true); // Notify that user is logged in
          console.log('SignIn successful. Token and user details stored.');
        } else {
          console.error('SignIn response did not contain a JWT token.');
          this.logout(); // Clear any partial data
        }
      })
    );
  }

  /**
   * Handles user sign-up.
   * @param signUpData The sign-up details.
   * @returns An Observable of the backend's sign-up response.
   */
  signUp(signUpData: SignUpRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, signUpData);
  }

  /**
   * Retrieves the JWT token from localStorage.
   * @returns The JWT token string or null if not found/not in browser.
   */
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) { // Only access localStorage in browser
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Checks if the user is currently logged in (has a JWT token).
   * This uses getToken(), which already handles platform checks.
   * @returns True if a token exists, false otherwise.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Logs out the user by removing token and user details from localStorage.
   * Also clears the internal user state and notifies subscribers.
   * @param navigate Optional: If true, redirects to sign-in page after logout.
   */
  logout(navigate: boolean = true): void {
    if (isPlatformBrowser(this.platformId)) { // Only access localStorage in browser
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRoles');
    }
    this._currentUserAutoId = null;
    this._currentUserRoles = [];
    this._isLoggedIn$.next(false); // Notify that user is logged out
    console.log('User logged out. Local storage and user state cleared.');
    if (navigate) {
      this.router.navigate(['/signin_signup']); // Redirect to sign-in page
    }
  }

  /**
   * Returns the current authenticated user's autoId.
   * @returns Observable emitting the user's autoId or null if not logged in.
   */
  getCurrentUserAutoId(): Observable<number | null> {
    return of(this._currentUserAutoId);
  }

  /**
   * Returns the current authenticated user's roles.
   * @returns Observable emitting an array of user roles.
   */
  getCurrentUserRoles(): Observable<string[]> {
    return of(this._currentUserRoles);
  }


  /**
   * Sends a request to initiate password reset (send OTP).
   * @param personalEmail The user's personal email to send OTP to.
   * @returns An Observable of the MessageResponse from the backend.
   */
  forgotPassword(personalEmail: string): Observable<MessageResponse> {
    // Backend expects a Map: Map.of("personalEmail", personalEmail)
    return this.http.post<MessageResponse>(`${this.apiUrl}/forgot-password`, { personalEmail: personalEmail });
  }

  getUserRoles(): string[] {
    if (isPlatformBrowser(this.platformId)) {
      const storedRoles = localStorage.getItem('userRoles');
      console.log('AuthService.getUserRoles(): Raw roles from localStorage:', storedRoles); // Debug log
      if (storedRoles) {
        try {
          const roles = JSON.parse(storedRoles);
          if (Array.isArray(roles) && roles.every(role => typeof role === 'string')) {
            console.log('AuthService.getUserRoles(): Parsed roles:', roles); // Debug log
            return roles; // Expecting roles like ["MANAGER", "USER"] directly
          }
          console.warn('AuthService.getUserRoles(): Stored "userRoles" is not a valid string array:', roles); // Warn
          return [];
        } catch (e) {
          console.error('AuthService.getUserRoles(): Error parsing "userRoles" from localStorage:', e); // Error
          return [];
        }
      }
    }
    console.log('AuthService.getUserRoles(): No "userRoles" found in localStorage or not in browser.'); // Debug log
    return [];
  }

  /**
   * Checks if the current user has the 'MANAGER' role.
   * @returns True if the user has the MANAGER role, false otherwise.
   */
  isManager(): boolean {
    const roles = this.getUserRoles();
    const isMgr = roles.includes('MANAGER'); // Check if 'MANAGER' string exists in the array
    console.log('AuthService.isManager(): Result:', isMgr, ' (Roles:', roles, ')'); // Debug log
    return isMgr;
  }

  getCurrentUserName(): string | null {
    if (isPlatformBrowser(this.platformId)) {
        return localStorage.getItem('userEmail'); // Assuming email is fine for display name
    }
    return null;
  }

  getEmployeeIdFromToken(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const decodedToken: any = jwtDecode(token);
      if (typeof decodedToken.employeeId === 'number') {
        return decodedToken.employeeId;
      }
      return null;
    } catch (e) {
      console.error('AuthService: Error decoding token for employeeId:', e);
      this.logout(false);
      return null;
    }
  }
  /**
   * Sends a request to reset the password using OTP.
   * @param resetRequest DTO containing organization email, OTP (token), and new password.
   * @returns An Observable of the MessageResponse from the backend.
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<MessageResponse> {
    // Backend expects ResetPasswordRequest DTO
    return this.http.post<MessageResponse>(`${this.apiUrl}/reset-password`, resetRequest);
  }
}