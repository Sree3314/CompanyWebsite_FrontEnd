import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../services/auth.service';

export interface ExhibitionDetailsItem {
  uploadId: string;
  title: string;
  description: string;
  uploaderFirstName: string;
  uploaderLastName: string;
  uploadDate: string;
  fileUrl: string;
  projectDuration: string;
  rating?: number | null;
  comment?: string | null;
  startedDate: string;
  endDate: string;
  externalEmployeeId: number;
}

@Component({
  selector: 'app-exhibition-details',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    DatePipe,
    RouterModule
  ],
  templateUrl: './exhibition-details.component.html',
  styleUrls: ['./exhibition-details.component.css']
})
export class ExhibitionDetailsComponent implements OnInit {
  uploadId: string | null = null;
  exhibitionItem: ExhibitionDetailsItem | null = null;
  loading: boolean = true;
  error: string | null = null;
  isManager: boolean = false;

  newRating: number | null = null;
  newComment: string = '';
  ratingMessage: string | null = null;
  commentMessage: string | null = null;

  private readonly BACKEND_BASE_URL = 'http://localhost:8089';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    console.log('ExhibitionDetailsComponent: Initializing. isManager (before ngOnInit):', this.isManager);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.uploadId = params.get('id');
      console.log('ExhibitionDetailsComponent: Received uploadId from route:', this.uploadId);
      if (this.uploadId) {
        this.isManager = this.authService.isManager();
        console.log('ExhibitionDetailsComponent: Manager status after AuthService check:', this.isManager);
        this.fetchExhibitionDetails(this.uploadId);
      } else {
        this.error = 'No exhibition item ID provided in the URL. Redirecting to exhibition list.';
        this.loading = false;
        this.router.navigate(['/exhibition']);
      }
    });
  }

  fetchExhibitionDetails(id: string): void {
    this.loading = true;
    this.error = null;

    const token = this.authService.getToken();
    if (!token) {
      this.error = 'Authentication token not found. Please log in to view details.';
      this.loading = false;
      this.router.navigate(['/signin']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<ExhibitionDetailsItem>(`${this.BACKEND_BASE_URL}/api/uploads/${id}`, { headers }).subscribe({
      next: (data) => {
        this.exhibitionItem = data;
        // IMPORTANT CHANGE: Initialize newRating and newComment to empty/null
        this.newRating = null; // Don't pre-populate from data.rating
        this.newComment = ''; // Don't pre-populate from data.comment
        this.loading = false;
        console.log('ExhibitionDetailsComponent: Fetched details:', data);
        console.log('ExhibitionDetailsComponent: fileUrl from backend:', this.exhibitionItem.fileUrl);
      },
      error: (err) => {
        console.error('Error fetching exhibition details:', err);
        if (err.status === 404) {
          this.error = 'Exhibition item not found or not available. Redirecting to exhibition list.';
          this.router.navigate(['/exhibition']);
        } else if (err.status === 401 || err.status === 403) {
           this.error = 'You are not authorized to view this content. Please log in.';
           this.router.navigate(['/signin']);
        }
        else {
          this.error = 'Failed to load exhibition details. Please try again later. Redirecting to exhibition list.';
          this.router.navigate(['/exhibition']);
        }
        this.loading = false;
      }
    });
  }

  submitRating(): void {
    this.ratingMessage = null;
    if (!this.isManager) {
      this.ratingMessage = 'You must be a Manager to submit a rating.';
      return;
    }
    if (!this.uploadId) {
      this.ratingMessage = 'Cannot submit rating: Missing Upload ID.';
      return;
    }
    if (this.newRating === null || this.newRating < 1 || this.newRating > 5) {
      this.ratingMessage = 'Please provide a valid rating between 1 and 5.';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.ratingMessage = 'Authentication required to submit rating.';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch(`${this.BACKEND_BASE_URL}/api/uploads/${this.uploadId}/rate`, { rating: this.newRating }, { headers }).subscribe({
      next: () => {
        this.ratingMessage = 'Rating submitted successfully!';
        // No longer update this.exhibitionItem.rating directly here if storing per-manager
        // For now, keep it for display of *overall* if backend supports it
        // If backend only allows one rating, this is fine for updating current display
        if (this.exhibitionItem) {
          this.exhibitionItem.rating = this.newRating;
        }
        this.newRating = null; // Clear field after submission
      },
      error: (err) => {
        console.error('Error submitting rating:', err);
        this.ratingMessage = 'Failed to submit rating. Error: ' + (err.error?.message || err.statusText || 'Unknown');
      }
    });
  }

  submitComment(): void {
    this.commentMessage = null;
    if (!this.isManager) {
      this.commentMessage = 'You must be a Manager to submit a comment.';
      return;
    }
    if (!this.uploadId) {
      this.commentMessage = 'Cannot submit comment: Missing Upload ID.';
      return;
    }
    if (!this.newComment || this.newComment.trim() === '') {
      this.commentMessage = 'Comment cannot be empty.';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.commentMessage = 'Authentication required to submit comment.';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch(`${this.BACKEND_BASE_URL}/api/uploads/${this.uploadId}/comment`, { comment: this.newComment }, { headers }).subscribe({
      next: () => {
        this.commentMessage = 'Comment submitted successfully!';
        // No longer update this.exhibitionItem.comment directly here if storing per-manager
        if (this.exhibitionItem) {
          this.exhibitionItem.comment = this.newComment;
        }
        this.newComment = ''; // Clear field after submission
      },
      error: (err) => {
        console.error('Error submitting comment:', err);
        this.commentMessage = 'Failed to submit comment. Error: ' + (err.error?.message || err.statusText || 'Unknown');
      }
    });
  }

  get uploaderFullName(): string {
    if (this.exhibitionItem?.uploaderFirstName && this.exhibitionItem?.uploaderLastName) {
      return `${this.exhibitionItem.uploaderFirstName} ${this.exhibitionItem.uploaderLastName}`;
    }
    return this.exhibitionItem?.externalEmployeeId ? `Employee ID: ${this.exhibitionItem.externalEmployeeId}` : 'Unknown Uploader';
  }

  openFileUrl(): void {
    if (this.exhibitionItem?.fileUrl) {
      let finalUrl = this.exhibitionItem.fileUrl.trim();

      if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
        console.log('openFileUrl: URL already absolute:', finalUrl);
      }
      else if (finalUrl.startsWith('www.')) {
        finalUrl = `https://${finalUrl}`;
        console.log('openFileUrl: Corrected www. URL to HTTPS:', finalUrl);
      }
      else if (finalUrl.startsWith('/')) {
        finalUrl = `${this.BACKEND_BASE_URL}${finalUrl}`;
        console.log('openFileUrl: Prepended backend base URL to relative path:', finalUrl);
      }
      else {
        finalUrl = `${this.BACKEND_BASE_URL}/${finalUrl}`;
        console.log('openFileUrl: Prepended backend base URL with slash to relative path:', finalUrl);
      }
      
      console.log('Opening absolute file URL:', finalUrl);
      try {
          window.open(finalUrl, '_blank');
      } catch (e) {
          console.error('Failed to open URL:', finalUrl, 'Error:', e);
      }
    } else {
      console.warn('ExhibitionDetailsComponent: No file URL available to open.');
    }
  }

  goBack(): void {
    this.router.navigate(['/exhibition']);
  }
}
