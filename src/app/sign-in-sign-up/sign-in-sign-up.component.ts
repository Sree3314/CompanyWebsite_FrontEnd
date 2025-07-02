// src/app/sign-in-sign-up.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { SignInRequest, SignUpRequest, ResetPasswordRequest, MessageResponse, EmployeeDetails } from '../models/auth.model';

// Interfaces for form-specific error messages
interface SignInErrors {
  email?: string;
  password?: string;
  nonFieldErrors?: string;
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
  styleUrls: ['./sign-in-sign-up.component.css']
})
export class SignInSignUpComponent implements OnInit {
  // Form State Variables
  showSignUpForm: boolean = false;
  showForgotPasswordForm: boolean = false;
  showResetPasswordForm: boolean = false;

  // Data Models for Forms
  signInData: SignInRequest = {
    email: '',
    password: ''
  };

  signUpData: SignUpRequest = {
    employeeId: null as any, // Initialize as null and expect number input
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactInformation: '',
    department: '',
    jobTitle: '',
    personalEmail: ''
  };

  forgotPasswordEmail: string = '';
  resetPasswordData: ResetPasswordRequest = {
    organizationEmail: '',
    token: '',
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

  // Loading indicator for fetching employee details
  isFetchingEmployeeDetails: boolean = false;
  // NEW: State to control read-only fields after details are fetched
  employeeDetailsFetched: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
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
    // Clear signup data when switching away, especially employeeId for fresh lookup
    this.signUpData = {
      employeeId: null as any, // Reset to null
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      contactInformation: '',
      department: '',
      jobTitle: '',
      personalEmail: ''
    };
    // NEW: Reset employeeDetailsFetched when switching forms
    this.employeeDetailsFetched = false;
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
        this.successMessage = response.message || 'Account created successfully! Please sign in.';

        // After success, switch to sign-in form and pre-fill email
        this.showSignUpForm = false;
        this.signInData.email = response.email || this.signUpData.email; // Pre-fill email from response or input
        this.signInData.password = ''; // Clear password
        this.clearSignUpErrors(); // Clear sign-up errors
        this.employeeDetailsFetched = false; // NEW: Reset read-only state on successful signup
      },
      error: (errorRes: HttpErrorResponse) => {
        console.error('Sign up failed:', errorRes);
        this.clearSignUpErrors(); // Clear previous sign-up errors
        if (errorRes.error && typeof errorRes.error === 'object') {
          // Backend might send field-specific error in 'error' property of error.error
          if (errorRes.error.error && typeof errorRes.error.error === 'object') {
            this.signUpErrors = errorRes.error.error;
          } else {
            // General error message if no specific field is identified
            this.signUpErrors.nonFieldErrors = errorRes.error?.error || errorRes.error?.message || 'Sign up failed. Please try again.';
          }
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

  /**
   * Handles fetching employee details when the "Fetch Details" button is clicked.
   * Renamed from onEmployeeIdChange to onFetchEmployeeDetails for clarity.
   */
  onFetchEmployeeDetails(): void {
    this.clearSignUpErrors(); // Clear any existing signup errors related to employeeId or other fields
    this.errorMessage = null; // Clear general error messages
    this.successMessage = null; // Clear success messages
    this.employeeDetailsFetched = false; // NEW: Reset read-only state before trying to fetch again

    if (this.signUpData.employeeId === null || this.signUpData.employeeId.toString().trim() === '') {
      this.signUpErrors.employeeId = 'Please enter an Employee ID before fetching details.';
      this.resetSignUpFormFieldsForPreFill(); // Clear pre-filled fields if employee ID is empty
      return;
    }

    const employeeIdNum = Number(this.signUpData.employeeId);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
      this.signUpErrors.employeeId = 'Please enter a valid Employee ID (a positive number).';
      this.resetSignUpFormFieldsForPreFill();
      return;
    }

    this.isFetchingEmployeeDetails = true; // Show loading indicator
    this.authService.getEmployeeDetails(employeeIdNum).subscribe({
      next: (details: EmployeeDetails) => {
        this.signUpData.firstName = details.firstName;
        this.signUpData.lastName = details.lastName;
        this.signUpData.email = details.email;
        // Uncomment if your backend EmployeeDetailsDTO includes these fields
        // this.signUpData.department = details.department || '';
        // this.signUpData.jobTitle = details.jobTitle || '';
        this.isFetchingEmployeeDetails = false;
        this.successMessage = 'Employee details loaded successfully!';
        this.employeeDetailsFetched = true; // NEW: Set to true on successful fetch
      },
      error: (errorRes: HttpErrorResponse) => {
        this.isFetchingEmployeeDetails = false;
        this.employeeDetailsFetched = false; // NEW: Ensure it's false on error
        console.error('Error fetching employee details:', errorRes);
        this.resetSignUpFormFieldsForPreFill(); // Clear fields on error

        if (errorRes.error && typeof errorRes.error === 'string') {
          this.signUpErrors.nonFieldErrors = errorRes.error; // Backend sends a direct string error
        } else if (errorRes.error && typeof errorRes.error === 'object' && errorRes.error.message) {
          this.signUpErrors.nonFieldErrors = errorRes.error.message; // Standard message from backend
        } else if (errorRes.error && typeof errorRes.error === 'object' && errorRes.error.error) {
           this.signUpErrors.nonFieldErrors = errorRes.error.error; // Custom 'error' field
        }
        else {
          this.signUpErrors.nonFieldErrors = 'Could not fetch employee details. Please check the ID and try again.';
        }
        this.successMessage = null; // Clear any previous success message on error
      }
    });
  }

  // Helper method to reset relevant signup form fields AND the read-only state
  private resetSignUpFormFieldsForPreFill(): void {
    this.signUpData.firstName = '';
    this.signUpData.lastName = '';
    this.signUpData.email = '';
    // If you uncommented department/jobTitle for pre-fill, reset them here too
    // this.signUpData.department = '';
    // this.signUpData.jobTitle = '';
    this.employeeDetailsFetched = false; // NEW: Ensure fields are editable again if reset
  }

  private clearAllMessagesAndErrors(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.clearSignInErrors();
    this.clearSignUpErrors();
    this.clearForgotPasswordErrors();
    this.clearResetPasswordErrors();
    this.employeeDetailsFetched = false; // NEW: Clear read-only state when clearing all
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