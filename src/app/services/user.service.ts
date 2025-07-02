
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; 
import { EmployeeDetails } from '../models/auth.model'; // Import the new interface

// Assuming these exist for profile management
export interface UserProfileResponse {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  contactInformation: string;
  department: string;
  jobTitle: string;
  profilePictureUrl?: string;
  // Add any other user profile fields
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userApiUrl = `http://localhost:8089/api/users`; // Assuming user-related endpoints
  private employeeApiUrl = `http://localhost:8089/api/employees`; // NEW: Dedicated endpoint for general employee data

  constructor(private http: HttpClient) { }

  // Existing: Fetches the current authenticated user's profile
  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.userApiUrl}/me`);
  }

  // Existing: Updates the current authenticated user's profile
  updateUserProfile(profileData: UserProfileResponse): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.userApiUrl}/me`, profileData);
  }

  // --- NEW: Method to fetch employee details by ID ---
  // This will be called from the SignupComponent
  getEmployeeDetailsById(employeeId: number): Observable<EmployeeDetails> {
    // Make sure your backend has an endpoint like /api/employees/{employeeId}
    return this.http.get<EmployeeDetails>(`${this.employeeApiUrl}/${employeeId}`);
  }
}