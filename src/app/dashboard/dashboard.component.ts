import { Component, OnInit } from '@angular/core';
import { UserService, UserProfileResponse } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UploadService } from '../services/Upload.service';
import { UploadDTO, UploadRequest } from '../models/upload.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
  standalone: true
})
export class DashboardComponent implements OnInit {
  userDetails: UserProfileResponse | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  editMode: boolean = false;
  editableUserDetails: UserProfileResponse | null = null;

  showUploadForm: boolean = false;
  uploadForm: UploadRequest = {
    uploadId:0,
    title: '',
    description: '',
    projectDuration: '',
    fileUrl: '',
    startedDate: '',
    endDate: '',
    externalEmployeeId: 0
  };

  myUploads: UploadDTO[] = [];
  showMyUploads: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private uploadService: UploadService,
    private router: Router
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
          this.errorMessage = 'Failed to update user details: ' + (error.error?.message || 'Server error.');
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
    this.clearMessages();
  }

  submitUpload(): void {
    if (!this.userDetails?.employeeId) {
      this.errorMessage = 'User employee ID not available. Cannot upload.';
      return;
    }
    this.uploadForm.externalEmployeeId = this.userDetails.employeeId;

    this.uploadService.createUpload(this.uploadForm).subscribe({
      next: (response) => {
        console.log('Upload successful:', response);
        this.successMessage = 'Your work has been uploaded successfully!';
        this.errorMessage = null;
        this.showUploadForm = false;
        this.fetchMyUploads(); // Refresh the list of uploads after successful submission
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        console.error('Error uploading work:', error);
        this.errorMessage = 'Failed to upload your work: ' + (error.error?.message || 'Server error.');
        this.successMessage = null;
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }

  cancelUpload(): void {
    this.showUploadForm = false;
    this.clearMessages();
  }

  viewMyUploads(): void {
    this.showMyUploads = true;
    this.showUploadForm = false;
    this.editMode = false;
    this.clearMessages();
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

  // --- New Delete Method ---
  deleteUpload(uploadId: number): void {
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

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}