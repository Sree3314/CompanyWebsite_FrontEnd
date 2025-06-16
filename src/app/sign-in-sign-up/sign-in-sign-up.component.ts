// src/app/sign-in-sign-up/sign-in-sign-up.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router
import { AuthService } from '../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-sign-in-sign-up',
  templateUrl: './sign-in-sign-up.component.html',
  styleUrls: ['./sign-in-sign-up.component.css'],
  imports: [CommonModule, FormsModule], // Import CommonModule and FormsModule for template directives
  // Make sure CommonModule and FormsModule are imported for template directives
  // These are often imported at the AppModule level if components are not standalone.
  // If this component were standalone, you'd add: imports: [CommonModule, FormsModule]
  // Since it's declared in AppModule, it gets them from there.
})
export class SignInSignUpComponent {
  showSignUpForm = false;

  // Form data objects
  signInData = { email: '', password: '' };
  signUpData = {
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactInformation: '',
    department: '',
    jobTitle: '',
    personalEmail: ''
  };

  // Inject Router and AuthService
  constructor(
    private router: Router, // Inject Router
    private authService: AuthService // Inject AuthService
  ) {}

  // Toggle between SignIn and SignUp forms
  toggleForm() {
    this.showSignUpForm = !this.showSignUpForm;
  }

  onSignIn() {
    console.log('Sending sign-in request:', this.signInData);
    this.authService.signIn(this.signInData).subscribe(
      (response) => {
        console.log('SignIn successful:', response);
        console.log('SignIn successful! Navigating to dashboard...');
        // Navigate to the dashboard or home page after successful login
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        console.error('SignIn failed:', error);
        console.error('SignIn failed. Please check your credentials.');
        // Potentially display a user-friendly error message on the UI
      }
    );
  }

  onSignUp() {
    console.log('Sending sign-up request:', this.signUpData);
    this.authService.signUp(this.signUpData).subscribe(
      (response) => {
        console.log('SignUp successful:', response);
        console.log('SignUp successful!');
        // Optionally, redirect to sign-in page after successful signup
        this.toggleForm(); // Switch back to sign-in form
        // Or you might auto-login the user after signup, depending on your flow
      },
      (error) => {
        console.error('SignUp failed:', error);
        console.error('SignUp failed. Please try again.');
        // Potentially display a user-friendly error message on the UI
      }
    );
  }
}
