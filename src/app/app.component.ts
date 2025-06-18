// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnInit, OnDestroy
import { CommonModule } from '@angular/common';
// MODIFIED LINE: Ensure Router is imported
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './services/auth.service'; // Import your AuthService
import { Subscription } from 'rxjs'; // Import Subscription to manage the subscription

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy { // Implement OnInit and OnDestroy
  title = 'Company Homepage';
  isLoggedIn: boolean = false; // This property will hold the current login status
  private authSubscription: Subscription | undefined; // To store and manage the subscription

  // MODIFIED LINE: Inject Router
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to the isLoggedIn$ observable from AuthService
    // This will notify the component whenever the login status changes
    // MODIFIED LINE: Added (loggedIn: boolean) type annotation
    this.authSubscription = this.authService.isLoggedIn$.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
      console.log('App Component: Login status changed to:', loggedIn);
    });
  }

  ngOnDestroy(): void {
    // It's crucial to unsubscribe to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // ADDED METHOD: Basic logout functionality
  logout(): void {
    this.authService.logout();
  }
}