import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient,HttpErrorResponse } from '@angular/common/http';
import { Observable, of, tap, BehaviorSubject,throwError } from 'rxjs';
import { Router } from '@angular/router';
 import {jwtDecode} from 'jwt-decode'; // Ensure you have jwt-decode installed: npm install jwt-decode
import { SignInRequest, SignInResponse, SignUpRequest ,MessageResponse,ResetPasswordRequest,EmployeeDetails} from '../models/auth.model';
import { catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'jwtToken';
  private readonly EMPLOYEE_ID_KEY = 'employeeId'; // Define a key for employeeId in localStorage
  private readonly USER_EMAIL_KEY = 'userEmail';
  private readonly USER_ROLES_KEY = 'userRoles';
 
  private apiUrl = 'http://localhost:8089/api/auth'; // Base URL for your auth API
 
  private _isLoggedIn$: BehaviorSubject<boolean>;
  isLoggedIn$: Observable<boolean>;
 
  private _currentUserAutoId: number | null = null;
  private _currentUserRoles: string[] = [];
 
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  )
  
  {
    this._isLoggedIn$ = new BehaviorSubject<boolean>(this.hasTokenInLocalStorage());
    this.isLoggedIn$ = this._isLoggedIn$.asObservable();
 
    this.loadUserFromLocalStorage();
  }
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend errors
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
      if (error.error && typeof error.error === 'object' && error.error.error) {
          errorMessage = error.error.error; // Assuming 'error' field exists for custom messages
      } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error; // Direct string error message
      } else if (error.message) {
          errorMessage = error.message; // Fallback to HTTP error message
      }
    }
    return throwError(() => new Error(errorMessage));
  }
  private hasTokenInLocalStorage(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem(this.TOKEN_KEY);
    }
    return false;
  }
 
  /**
   * Attempts to load user details (including employeeId) from localStorage on service initialization.
   * Updates internal state and notifies subscribers.
   */
  private loadUserFromLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this._isLoggedIn$.next(false);
      return;
    }
 
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedEmail = localStorage.getItem(this.USER_EMAIL_KEY);
    const storedRoles = localStorage.getItem(this.USER_ROLES_KEY);
    const storedEmployeeId = localStorage.getItem(this.EMPLOYEE_ID_KEY); // Retrieve employeeId using its constant key
 
    if (storedToken && storedEmail && storedRoles && storedEmployeeId) {
      this._currentUserAutoId = parseInt(storedEmployeeId, 10); // Parse to number
      this._currentUserRoles = JSON.parse(storedRoles);
      this._isLoggedIn$.next(true);
      console.log('AuthService: Restored user from localStorage. Logged in with Employee ID:', this._currentUserAutoId);
    } else {
      this.logout(false);
    }
  }
 
  /**
   * Handles user sign-in. Stores JWT and user info in localStorage upon success.
   * Now correctly stores the employeeId from the backend response.
   * @param signInData The sign-in credentials (email, password).
   * @returns An Observable of the SignInResponse.
   */
  signIn(signInData: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.apiUrl}/login`, signInData).pipe(
      tap(response => {
        if (response && response.jwtToken) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TOKEN_KEY, response.jwtToken);
            localStorage.setItem(this.USER_EMAIL_KEY, response.email);
            localStorage.setItem(this.USER_ROLES_KEY, JSON.stringify(response.roles));
            // NEW: Store the employeeId received from the backend response
            // Ensure response.employeeId exists and is a number before calling toString()
            if (response.employeeId !== undefined && response.employeeId !== null) {
              localStorage.setItem(this.EMPLOYEE_ID_KEY, response.employeeId.toString());
            } else {
              console.warn('SignIn response is missing employeeId. Current user ID will not be set correctly.');
            }
          }
 
          // NEW: Use the actual employeeId from the response
          this._currentUserAutoId = response.employeeId || null; // Use employeeId from response, default to null
          this._currentUserRoles = response.roles;
 
          this._isLoggedIn$.next(true);
          console.log('SignIn successful. Token and user details stored. Employee ID:', this._currentUserAutoId);
        } else {
          console.error('SignIn response did not contain a JWT token.');
          this.logout();
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
    if (isPlatformBrowser(this.platformId)) {
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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_EMAIL_KEY);
      localStorage.removeItem(this.USER_ROLES_KEY);
      localStorage.removeItem(this.EMPLOYEE_ID_KEY); // NEW: Remove employeeId on logout
    }
    this._currentUserAutoId = null;
    this._currentUserRoles = [];
    this._isLoggedIn$.next(false);
    console.log('User logged out. Local storage and user state cleared.');
    if (navigate) {
      this.router.navigate(['/signin_signup']);
    }
  }
 
  /**
   * Returns the current authenticated user's autoId (employeeId).
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
    return this.http.post<MessageResponse>(`${this.apiUrl}/forgot-password`, { personalEmail: personalEmail });
  }
 
  /**
   * Sends a request to reset the password using OTP.
   * @param resetRequest DTO containing organization email, OTP (token), and new password.
   * @returns An Observable of the MessageResponse from the backend.
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/reset-password`, resetRequest);
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
  getEmployeeDetails(employeeId: number): Observable<EmployeeDetails> {
    return this.http.get<EmployeeDetails>(`http://localhost:8089/api/users/employee-details/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }
}
 
 