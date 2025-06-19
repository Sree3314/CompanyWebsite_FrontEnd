import { Component, OnInit } from '@angular/core';
import { UserService, UserProfileResponse } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UploadService } from '../services/Upload.service';
import { UploadDTO, UploadRequest } from '../models/upload.model'; // Corrected import path for DTOs
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common'; // Added DatePipe import
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http'; // Added HttpErrorResponse import
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DatePipe], // Added DatePipe to imports
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // User Profile Properties
  userDetails: UserProfileResponse | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
 
  editMode: boolean = false;
  editableUserDetails: UserProfileResponse | null = null;
 
  // Upload Form Properties
  showUploadForm: boolean = false;
  uploadForm: UploadRequest = { // CRITICAL: Aligned with your UploadRequest structure
    uploadId: 0, // Ensure this matches your DTO/model
    title: '',
    description: '',
    projectDuration: '',
    fileUrl: '',
    startedDate: '', // Dates can be strings for form binding, then parsed as needed
    endDate: '',
    externalEmployeeId: 0 // Will be set from authenticated user
  };
 
  // My Uploads Properties
  myUploads: UploadDTO[] = [];
  showMyUploads: boolean = false;
 
  // Property to store validation errors from the backend
  validationErrors: { [key: string]: string } = {}; // Object to hold fieldName: errorMessage pairs
 
  // For delete confirmation modal (if you have one in HTML)
  showDeleteConfirmation: boolean = false;
  uploadToDeleteId: number | null = null; // Assuming uploadId is a number
 
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private uploadService: UploadService, // Correct UploadService
    private router: Router // Inject Router
  ) { }
 
  ngOnInit(): void {
    this.fetchUserDetails();
  }
 
  fetchUserDetails(): void {
    this.userService.getUserProfile().subscribe({
      next: (data) => {
        this.userDetails = data;
        this.editableUserDetails = { ...data };
        if (this.userDetails.employeeId) {
          this.uploadForm.externalEmployeeId = this.userDetails.employeeId;
        }
        console.log('User details fetched:', this.userDetails);
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
        console.error('Error details:', error.error);
        this.errorMessage = 'Failed to load user details. Please try again.';
        if (error.status === 401 || error.status === 403) {
          this.authService.logout();
          this.router.navigate(['/signin_signup']);
        }
      }
    });
  }
 
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/signin_signup']);
  }
 
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.showUploadForm = false;
    this.showMyUploads = false;
    if (this.editMode && this.userDetails) {
      this.editableUserDetails = { ...this.userDetails };
    }
    this.clearMessages();
  }
 
  saveChanges(): void {
    if (this.editableUserDetails) {
      this.userService.updateUserProfile(this.editableUserDetails).subscribe({
        next: (updatedData) => {
          this.userDetails = updatedData;
          this.editMode = false;
          this.successMessage = 'Profile updated successfully!';
          this.errorMessage = null;
          setTimeout(() => this.successMessage = null, 3000);
          console.log('User details updated successfully:', this.userDetails);
        },
        error: (error) => {
          console.error('Error updating user details:', error);
          // Assuming user profile updates can also return 400 for validation errors
          if (error.status === 400 && error.error) {
              this.validationErrors = error.error as { [key: string]: string };
              this.errorMessage = 'Please correct the highlighted profile fields.';
          } else if (error.status === 401 || error.status === 403) {
              this.errorMessage = 'Authentication failed. Please log in again.';
              this.authService.logout();
              this.router.navigate(['/signin_signup']);
          } else {
              this.errorMessage = 'Failed to update user details: ' + (error.error?.message || 'Server error.');
          }
          this.successMessage = null;
          if (this.userDetails) {
            this.editableUserDetails = { ...this.userDetails };
          }
          setTimeout(() => this.errorMessage = null, 5000);
        }
      });
    }
  }
 
  cancelEdit(): void {
    if (this.userDetails) {
      this.editableUserDetails = { ...this.userDetails };
    }
    this.editMode = false;
    this.clearMessages();
  }
 
  uploadAchievements(): void {
    this.showUploadForm = true;
    this.showMyUploads = false;
    this.editMode = false;
    // Reset form and clear validation errors when opening the form
    this.uploadForm = {
      uploadId: 0, // Resetting uploadId for new uploads
      title: '',
      description: '',
      projectDuration: '',
      fileUrl: '',
      startedDate: '',
      endDate: '',
      externalEmployeeId: this.userDetails?.employeeId || 0
    };
    this.clearMessages(); // Clear general success/error messages
    this.validationErrors = {}; // Clear validation errors
  }
 
  submitUpload(): void {
    if (!this.userDetails?.employeeId) {
      this.errorMessage = 'User employee ID not available. Cannot upload.';
      return;
    }
    this.uploadForm.externalEmployeeId = this.userDetails.employeeId;
 
    this.successMessage = null; // Clear previous success messages
    this.errorMessage = null;   // Clear previous general errors
    this.validationErrors = {}; // CRITICAL: Clear previous validation errors before new submission
 
    this.uploadService.createUpload(this.uploadForm).subscribe({
      next: (response) => {
        console.log('Upload successful:', response);
        this.successMessage = 'Your work has been uploaded successfully!';
        this.errorMessage = null;
        this.showUploadForm = false;
        this.fetchMyUploads(); // Refresh the list of uploads after successful submission
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err: HttpErrorResponse) => { // Type the error as HttpErrorResponse for better type safety
        console.error('Error uploading work:', err);
        if (err.status === 400 && err.error) {
          // Backend sent 400 with validation errors. Parse and display them.
          this.validationErrors = err.error as { [key: string]: string }; // Cast to dictionary
          this.errorMessage = 'Please correct the highlighted fields.'; // General message for validation
        } else if (err.status === 401 || err.status === 403) {
          // Authentication/Authorization error, let interceptor handle if not already
          this.errorMessage = 'Authentication failed. Please log in again.';
          this.authService.logout();
          this.router.navigate(['/signin_signup']);
        } else {
          // Other types of errors (e.g., 500 Internal Server Error, network issues)
          this.errorMessage = 'Failed to upload your work: ' + (err.error?.message || err.message || 'Unknown server error.');
        }
        this.successMessage = null; // Ensure success message is cleared on error
        setTimeout(() => this.errorMessage = null, 5000); // Clear general error after some time
      }
    });
  }
 
  cancelUpload(): void {
    this.showUploadForm = false;
    this.clearMessages();
    this.validationErrors = {}; // Clear validation errors on cancel
  }
 
  viewMyUploads(): void {
    this.showMyUploads = true;
    this.showUploadForm = false;
    this.editMode = false;
    this.clearMessages();
    this.validationErrors = {}; // Clear validation errors when switching sections
    this.fetchMyUploads();
  }
 
  fetchMyUploads(): void {
    this.myUploads = [];
    this.uploadService.getMyUploads().subscribe({
      next: (data) => {
        this.myUploads = data;
        this.errorMessage = null;
        console.log('My uploads fetched:', this.myUploads);
      },
      error: (error) => {
        console.error('Error fetching my uploads:', error);
        this.errorMessage = 'Failed to load your uploads: ' + (error.error?.message || 'Server error.');
        this.successMessage = null;
        this.myUploads = [];
        setTimeout(() => this.errorMessage = null, 5000);
        if (error.status === 401 || error.status === 403) {
          this.authService.logout();
          this.router.navigate(['/signin_signup']);
        }
      }
    });
  }
 
  // --- Delete Method ---
  deleteUpload(uploadId: number): void { // Changed type to number to match your upload.model.ts
    if (confirm('Are you sure you want to delete this upload? This action cannot be undone.')) {
      this.uploadService.deleteUpload(uploadId).subscribe({
        next: () => {
          this.successMessage = 'Upload deleted successfully!';
          this.errorMessage = null;
          this.fetchMyUploads(); // Refresh the list after deletion
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          console.error('Error deleting upload:', error);
          this.errorMessage = 'Failed to delete upload: ' + (error.error?.message || 'Server error.');
          this.successMessage = null;
          setTimeout(() => this.errorMessage = null, 5000);
        }
      });
    }
  }
 
  // New method to handle navigation to exhibition details from My Uploads
  // Ensure the ID type matches what ExhibitionComponent expects (string or number)
  onViewDetails(uploadId: number): void { // Assuming uploadId is a number
    this.router.navigate(['/exhibition', uploadId]);
  }
 
 
  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.validationErrors = {}; // Also clear validation errors
  }
}
 
 