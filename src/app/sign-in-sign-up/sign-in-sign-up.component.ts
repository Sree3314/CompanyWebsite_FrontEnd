import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse

import { SignInRequest, SignUpRequest, ResetPasswordRequest, MessageResponse } from '../models/auth.model'; // Import new interfaces

// Interfaces for form-specific error messages
interface SignInErrors {
  email?: string;
  password?: string;
  nonFieldErrors?: string; // For general errors not tied to a specific field
}

interface SignUpErrors {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  contactInformation?: string;
  department?: string;
  jobTitle?: string;
  personalEmail?: string;
  nonFieldErrors?: string;
}

interface ForgotPasswordErrors {
  personalEmail?: string;
  nonFieldErrors?: string;
}

interface ResetPasswordErrors {
  organizationEmail?: string;
  token?: string;
  newPassword?: string;
  nonFieldErrors?: string;
}

@Component({
  selector: 'app-signin-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-in-sign-up.component.html',
  styleUrls: ['./sign-in-sign-up.component.css'] // Keep this for now, will be removed after full Tailwind conversion
})
export class SignInSignUpComponent implements OnInit {
  // Form State Variables
  showSignUpForm: boolean = false;
  showForgotPasswordForm: boolean = false;
  showResetPasswordForm: boolean = false; // To show the form for OTP & New Password

  // Data Models for Forms
  signInData: SignInRequest = {
    email: '',
    password: ''
  };

  signUpData: SignUpRequest = {
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

  forgotPasswordEmail: string = ''; // For the "forgot password" email input
  resetPasswordData: ResetPasswordRequest = { // For the "reset password" form
    organizationEmail: '',
    token: '', // This will be the OTP
    newPassword: ''
  };

  // Message Handling
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Form-specific error objects
  signInErrors: SignInErrors = {};
  signUpErrors: SignUpErrors = {};
  forgotPasswordErrors: ForgotPasswordErrors = {};
  resetPasswordErrors: ResetPasswordErrors = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']); // Changed from /dashboard to /home as per job-portal usage
    }
  }

  /**
   * Toggles between sign-in and sign-up forms.
   * Resets other form states and clears messages/errors.
   */
  toggleForm(): void {
    this.showSignUpForm = !this.showSignUpForm;
    this.showForgotPasswordForm = false; // Hide forgot password form
    this.showResetPasswordForm = false; // Hide reset password form
    this.clearAllMessagesAndErrors();
  }

  /**
   * Navigates to the forgot password flow.
   * Resets other form states and clears messages/errors.
   */
  goToForgotPassword(): void {
    this.showSignUpForm = false;
    this.showForgotPasswordForm = true;
    this.showResetPasswordForm = false;
    this.clearAllMessagesAndErrors();
    this.forgotPasswordEmail = ''; // Clear previous email
  }

  /**
   * Back to sign in form from any other form.
   */
  backToSignIn(): void {
    this.showSignUpForm = false;
    this.showForgotPasswordForm = false;
    this.showResetPasswordForm = false;
    this.clearAllMessagesAndErrors();
  }

  onSignIn(): void {
    this.clearAllMessagesAndErrors();
    this.authService.signIn(this.signInData).subscribe({
      next: (response) => {
        this.successMessage = 'Sign in successful!';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (errorRes: HttpErrorResponse) => {
        console.error('Sign in failed:', errorRes);
        this.clearSignInErrors(); // Clear previous sign-in errors
        if (errorRes.error && typeof errorRes.error === 'object') {
          // Assuming backend returns field-specific errors in error.error
          this.signInErrors = errorRes.error;
        } else {
          // Assuming backend returns a general error message in error.error or error.error.error
          this.signInErrors.nonFieldErrors = errorRes.error?.error || errorRes.error?.message || 'Sign in failed. Please check your credentials.';
        }
        this.successMessage = null; // Ensure success message is null on error
      }
    });
  }

  onSignUp(): void {
    this.clearAllMessagesAndErrors();
    this.authService.signUp(this.signUpData).subscribe({
      next: (response: MessageResponse) => { // Expecting MessageResponse
        console.log('SignUp successful:', response);
        // Use a custom message box/modal instead of window.alert
        this.successMessage = response.message || 'Account created successfully! Please sign in.';

        // After success, switch to sign-in form and pre-fill email
        this.showSignUpForm = false;
        this.signInData.email = response.email || this.signUpData.email; // Pre-fill email from response or input
        this.signInData.password = ''; // Clear password
        this.clearSignUpErrors(); // Clear sign-up errors
      },
      error: (errorRes: HttpErrorResponse) => {
        console.error('Sign up failed:', errorRes);
        this.clearSignUpErrors(); // Clear previous sign-up errors
        if (errorRes.error && typeof errorRes.error === 'object') {
          this.signUpErrors = errorRes.error;
        } else {
          this.signUpErrors.nonFieldErrors = errorRes.error?.error || errorRes.error?.message || 'Sign up failed. Please try again.';
        }
        this.successMessage = null; // Ensure success message is null on error
      }
    });
  }

  /**
   * Handles the request to send OTP for password reset.
   */
  onRequestOtp(): void {
    this.clearAllMessagesAndErrors();
    if (!this.forgotPasswordEmail) {
      this.forgotPasswordErrors.personalEmail = 'Please enter your personal email.';
      return;
    }
    console.log('Requesting OTP for:', this.forgotPasswordEmail);
    this.authService.forgotPassword(this.forgotPasswordEmail).subscribe({
      next: (response: MessageResponse) => { // Expecting MessageResponse
        console.log('OTP request successful:', response);
        this.successMessage = response.message || 'OTP sent to your personal email.';
        // Pre-fill organization email for reset form (if it's the same)
        this.resetPasswordData.organizationEmail = this.forgotPasswordEmail;
        this.showForgotPasswordForm = false; // Hide forgot password form
        this.showResetPasswordForm = true; // Show reset password form
        this.forgotPasswordEmail = ''; // Clear email input
        this.clearForgotPasswordErrors(); // Clear forgot password errors
      },
      error: (errorRes: HttpErrorResponse) => {
        console.error('OTP request failed:', errorRes);
        this.clearForgotPasswordErrors(); // Clear previous forgot password errors
        if (errorRes.error && typeof errorRes.error === 'object') {
          this.forgotPasswordErrors = errorRes.error;
        } else {
          this.forgotPasswordErrors.nonFieldErrors = errorRes.error?.error || errorRes.error?.message || 'Failed to send OTP. Please check your email.';
        }
        this.successMessage = null; // Ensure success message is null on error
      }
    });
  }

  /**
   * Handles the password reset submission (with OTP and new password).
   */
  onResetPassword(): void {
    this.clearAllMessagesAndErrors();
    if (!this.resetPasswordData.organizationEmail || !this.resetPasswordData.token || !this.resetPasswordData.newPassword) {
      this.resetPasswordErrors.nonFieldErrors = 'All fields are required.';
      return;
    }
    console.log('Attempting to reset password for:', this.resetPasswordData.organizationEmail);
    this.authService.resetPassword(this.resetPasswordData).subscribe({
      next: (response: MessageResponse) => { // Expecting MessageResponse
        console.log('Password reset successful:', response);
        this.successMessage = response.message || 'Password reset successfully.';
        // After successful reset, go back to sign-in form
        this.resetPasswordData = { organizationEmail: '', token: '', newPassword: '' }; // Clear data
        this.showResetPasswordForm = false;
        this.backToSignIn(); // Navigate back to the sign-in form
        this.clearResetPasswordErrors(); // Clear reset password errors
      },
      error: (errorRes: HttpErrorResponse) => {
        console.error('Password reset failed:', errorRes);
        this.clearResetPasswordErrors(); // Clear previous reset password errors
        if (errorRes.error && typeof errorRes.error === 'object') {
          this.resetPasswordErrors = errorRes.error;
        } else {
          this.resetPasswordErrors.nonFieldErrors = errorRes.error?.error || errorRes.error?.message || 'Password reset failed. Please check OTP or try again.';
        }
        this.successMessage = null; // Ensure success message is null on error
      }
    });
  }

  // Helper methods to clear messages and specific error objects
  private clearAllMessagesAndErrors(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.clearSignInErrors();
    this.clearSignUpErrors();
    this.clearForgotPasswordErrors();
    this.clearResetPasswordErrors();
  }

  private clearSignInErrors(): void {
    this.signInErrors = {};
  }

  private clearSignUpErrors(): void {
    this.signUpErrors = {};
  }

  private clearForgotPasswordErrors(): void {
    this.forgotPasswordErrors = {};
  }

  private clearResetPasswordErrors(): void {
    this.resetPasswordErrors = {};
  }
}
