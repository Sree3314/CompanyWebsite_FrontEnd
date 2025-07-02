import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
 
import { AuthService } from '../services/auth.service';
 
export interface ExhibitionItem {
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
  selector: 'app-exhibition',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    DatePipe
  ],
  templateUrl: './exhibition.component.html',
  styleUrls: ['./exhibition.component.css']
})
export class ExhibitionComponent implements OnInit {
  exhibitionItems: ExhibitionItem[] = [];
  loading: boolean = true;
  error: string | null = null;
 
  filterType: 'none' | 'employeeId' | 'firstName' = 'none';
  filterValue: string | null = null;
 
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}
 
  ngOnInit(): void {
    console.log('Frontend: ExhibitionComponent ngOnInit - Fetching items...');
    this.fetchExhibitionItems();
  }
 
  fetchExhibitionItems(): void {
    this.loading = true;
    this.error = null;
 
    const token = this.authService.getToken();
    console.log('ExhibitionComponent: Token retrieved:', token ? 'Exists' : 'Null');
 
    if (!token) {
      this.error = 'Authentication token not found. Please log in to view the Exhibition.';
      this.loading = false;
      // FIX: Redirect to the correct sign-in/sign-up page
      this.router.navigate(['/signin_signup']);
      return;
    }
 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
 
    let apiUrl = 'http://localhost:8089/api/exhibition';
    let params = new HttpParams();
 
    console.log('Filter Type (before API call):', this.filterType, 'Filter Value (before API call):', this.filterValue);
 
    if (this.filterType === 'employeeId' && this.filterValue) {
      const employeeId = parseInt(this.filterValue, 10);
      if (!isNaN(employeeId)) {
        apiUrl = 'http://localhost:8089/api/exhibition/filtered-projects';
        params = params.append('externalEmployeeId', employeeId.toString());
      } else {
        this.error = 'Please enter a valid Employee ID (numbers only).';
        this.loading = false;
        return;
      }
    } else if (this.filterType === 'firstName' && this.filterValue && this.filterValue.trim() !== '') {
      apiUrl = 'http://localhost:8089/api/exhibition/filtered-projects';
      params = params.append('firstName', this.filterValue.trim());
    }
 
    console.log('Constructing API URL for filter:', apiUrl, 'with params:', params.toString());
 
    this.http.get<ExhibitionItem[]>(apiUrl, { headers, params }).subscribe({
      next: (data) => {
        this.exhibitionItems = data;
        this.loading = false;
        console.log('Frontend: exhibitionItems RECEIVED from backend:', data); // Log the raw data
        console.log('Frontend: exhibitionItems AFTER assignment (in component):', this.exhibitionItems); // Log the assigned data
      },
      error: (err) => {
        console.error('Error fetching exhibition items:', err);
        this.error = 'Failed to load exhibition items. Please check your network or try again later. (Error: ' + (err.statusText || err.message || 'Unknown') + ')';
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          // FIX: Redirect to the correct sign-in/sign-up page on auth error
          this.router.navigate(['/signin_signup']);
        }
      }
    });
  }
 
  uploaderFullName(item: ExhibitionItem): string {
    let fullName = '';
    if (item?.uploaderFirstName && item?.uploaderLastName) {
      fullName = `${item.uploaderFirstName} ${item.uploaderLastName}`;
    } else if (item?.uploaderFirstName) {
      fullName = item.uploaderFirstName;
    } else if (item?.uploaderLastName) {
      fullName = item.uploaderLastName;
    } else {
      fullName = 'Unknown Uploader';
    }
 
    if (item?.externalEmployeeId !== null && item?.externalEmployeeId !== undefined) {
      return `${fullName} (ID: ${item.externalEmployeeId})`;
    }
    return fullName;
  }
 
  onViewDetails(uploadId: string): void {
    console.log('Attempting to navigate to details for uploadId:', uploadId);
    this.router.navigate(['/exhibition', uploadId]);
  }
 
  clearFilters(): void {
    this.filterType = 'none';
    this.filterValue = null;
    this.error = null;
    this.fetchExhibitionItems();
  }
}
 
 