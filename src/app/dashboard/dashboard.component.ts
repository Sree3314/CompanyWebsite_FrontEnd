// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService, UserProfileResponse } from '../services/user.service'; // Import UserService and UserProfileResponse
import { AuthService } from '../services/auth.service'; // Import AuthService
import { Router } from '@angular/router'; // Import Router
import { CommonModule } from '@angular/common'; // Required for *ngIf, *ngFor

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule], // Add CommonModule for directives like *ngIf
  standalone: true // Mark as standalone
})
export class DashboardComponent implements OnInit {
  userDetails: UserProfileResponse | null = null;
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService, // Inject AuthService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchUserDetails();
  }

  /**
   * Fetches the user's profile details from the backend.
   */
  fetchUserDetails(): void {
    this.userService.getUserProfile().subscribe({
      next: (data) => {
        this.userDetails = data;
        console.log('User details fetched:', this.userDetails);
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
        this.errorMessage = 'Failed to load user details. Please try again.';
        // The AuthInterceptor should handle 401/403, but this is a fallback.
        // If the error indicates invalid/expired token, logout and redirect.
        if (error.status === 401 || error.status === 403) {
          this.authService.logout(); // Clear invalid token
          this.router.navigate(['/signin_signup']); // Redirect to sign-in page
        }
      }
    });
  }

  /**
   * Logs out the user.
   */
  logout(): void {
    this.authService.logout(); // Use the logout method from AuthService
    this.router.navigate(['/signin_signup']); // Redirect to sign-in page
  }
}
