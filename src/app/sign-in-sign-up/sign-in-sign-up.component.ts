import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

import { SignInRequest, SignUpRequest, ResetPasswordRequest, MessageResponse } from '../models/auth.model'; // Import new interfaces

@Component({
  selector: 'app-signin-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-in-sign-up.component.html',
  styleUrls: ['./sign-in-sign-up.component.css']
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Toggles between sign-in and sign-up forms.
   * Resets other form states.
   */
  toggleForm(): void {
    this.showSignUpForm = !this.showSignUpForm;
    this.showForgotPasswordForm = false; // Hide forgot password form
    this.showResetPasswordForm = false; // Hide reset password form
    this.clearMessages();
  }

  /**
   * Navigates to the forgot password flow.
   * Resets other form states.
   */
  goToForgotPassword(): void {
    this.showSignUpForm = false;
    this.showForgotPasswordForm = true;
    this.showResetPasswordForm = false;
    this.clearMessages();
    this.forgotPasswordEmail = ''; // Clear previous email
  }

  /**
   * Back to sign in form from any other form.
   */
  backToSignIn(): void {
    this.showSignUpForm = false;
    this.showForgotPasswordForm = false;
    this.showResetPasswordForm = false;
    this.clearMessages();
  }

  onSignIn(): void {
    this.clearMessages();
    this.authService.signIn(this.signInData).subscribe({
      next: (response) => {
        this.successMessage = 'Sign in successful! Redirecting to dashboard...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        console.error('Sign in failed:', error);
        // Backend now returns JSON { "error": "message" }
        this.errorMessage = error.error?.error || 'Sign in failed. Please check your credentials.';
        this.successMessage = null;
      }
    });
  }

  onSignUp(): void {
    this.clearMessages();
    this.authService.signUp(this.signUpData).subscribe({
      next: (response: MessageResponse) => { // Expecting MessageResponse
        console.log('SignUp successful:', response);
        // Use response.message for alert
        window.alert(response.message || 'Account created successfully!');

        this.showSignUpForm = false;
        this.signInData.email = response.email || this.signUpData.email; // Pre-fill email from response or input
        this.signInData.password = '';
        this.clearMessages();
      },
      error: (error) => {
        console.error('Sign up failed:', error);
        // Backend now returns JSON { "error": "message" }
        this.errorMessage = error.error?.error || 'Sign up failed. Please try again.';
        this.successMessage = null;
      }
    });
  }

  /**
   * Handles the request to send OTP for password reset.
   */
  onRequestOtp(): void {
    this.clearMessages();
    if (!this.forgotPasswordEmail) {
      this.errorMessage = 'Please enter your personal email.';
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
      },
      error: (error) => {
        console.error('OTP request failed:', error);
        // Backend now returns JSON { "error": "message" }
        this.errorMessage = error.error?.error || 'Failed to send OTP. Please check your email.';
        this.successMessage = null;
      }
    });
  }

  /**
   * Handles the password reset submission (with OTP and new password).
   */
  onResetPassword(): void {
    this.clearMessages();
    if (!this.resetPasswordData.organizationEmail || !this.resetPasswordData.token || !this.resetPasswordData.newPassword) {
      this.errorMessage = 'All fields are required.';
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
      },
      error: (error) => {
        console.error('Password reset failed:', error);
        // Backend now returns JSON { "error": "message" }
        this.errorMessage = error.error?.error || 'Password reset failed. Please check OTP or try again.';
        this.successMessage = null;
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}