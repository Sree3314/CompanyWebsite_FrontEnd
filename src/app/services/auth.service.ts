// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs'; // Import 'of' from 'rxjs'

// Define interfaces for your sign-in/sign-up requests and responses
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  jwtToken: string;
  email: string;
  roles: string[]; // Assuming your backend returns roles
  // Add other fields if your backend login response includes them, e.g., firstName, lastName
}

interface SignUpRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactInformation: string;
  department: string;
  jobTitle: string;
  personalEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private signUpUrl = 'http://localhost:8089/api/auth/register';
  private signInUrl = 'http://localhost:8089/api/auth/login';

  // These will hold the current user's details for use across the application
  // Initialize with null/empty for no logged-in user
  private _currentUserAutoId: number | null = null;
  private _currentUserRoles: string[] = [];

  constructor(private http: HttpClient) {
    // In a real application, you might try to load token/user info from localStorage here
    // on app startup to restore a session.
    this.loadUserFromLocalStorage();
  }

  /**
   * Attempts to load user details from localStorage on service initialization.
   */
  private loadUserFromLocalStorage(): void {
    const storedToken = localStorage.getItem('jwtToken');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRoles = localStorage.getItem('userRoles');
    // You would typically decode the JWT here to get user ID or make an API call /me
    // For this example, we'll just set dummy data if a token exists for demonstration.
    if (storedToken && storedEmail && storedRoles) {
      // In a real app, you'd decode the JWT to get the user ID, or fetch it from /api/users/me
      // For now, let's just assume a dummy ID for the current logged-in user if a token exists.
      // This is for client-side display logic; actual auth is backend-enforced.
      // Replace with actual logic to get user ID from token or /me endpoint
      this._currentUserAutoId = 101; // Example dummy ID for active user (e.g., matching a test user in your backend)
      this._currentUserRoles = JSON.parse(storedRoles);
      console.log('AuthService: Restored user from localStorage.');
    }
  }


  /**
   * Handles user sign-in.
   * Stores JWT and user info in localStorage upon success.
   * @param signInData The sign-in credentials (email, password).
   * @returns An Observable of the SignInResponse.
   */
  signIn(signInData: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(this.signInUrl, signInData).pipe(
      tap(response => {
        if (response && response.jwtToken) {
          localStorage.setItem('jwtToken', response.jwtToken);
          localStorage.setItem('userEmail', response.email);
          localStorage.setItem('userRoles', JSON.stringify(response.roles));

          // Set internal state for current user.
          // IMPORTANT: You'll need to get the user's autoId from your backend's login response
          // or a subsequent /me API call. For now, using a dummy.
          // If your SignInResponse contains userAutoId, use that:
          // this._currentUserAutoId = response.userAutoId;
          this._currentUserAutoId = 101; // Placeholder: Replace with actual user's autoId from backend
          this._currentUserRoles = response.roles;

          console.log('Token and user details stored. User state updated.');
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
    return this.http.post(this.signUpUrl, signUpData);
  }

  /**
   * Retrieves the JWT token from localStorage.
   * @returns The JWT token string or null if not found.
   */
  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  /**
   * Checks if the user is currently logged in (has a JWT token).
   * @returns True if a token exists, false otherwise.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Logs out the user by removing token and user details from localStorage.
   * Also clears the internal user state.
   */
  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRoles');
    this._currentUserAutoId = null;
    this._currentUserRoles = [];
    console.log('User logged out. Local storage and user state cleared.');
  }

  /**
   * Returns the current authenticated user's autoId.
   * This would typically come from a decoded JWT or user session.
   * @returns Observable emitting the user's autoId or null if not logged in.
   */
  getCurrentUserAutoId(): Observable<number | null> {
    return of(this._currentUserAutoId);
  }

  /**
   * Returns the current authenticated user's roles.
   * This would typically come from a decoded JWT or user session.
   * @returns Observable emitting an array of user roles.
   */
  getCurrentUserRoles(): Observable<string[]> {
    return of(this._currentUserRoles);
  }

}
