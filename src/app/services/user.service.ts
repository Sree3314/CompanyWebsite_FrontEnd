// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the interface for the UserProfileResponse DTO from your backend
// Ensure this matches the structure of com.example.MainProject.dto.UserProfileResponse
export interface UserProfileResponse {
  employeeId: number; // Assuming employeeId is a number
  firstName: string;
  lastName: string;
  email: string;
  contactInformation: string;
  department: string;
  jobTitle: string;
  profilePictureUrl?: string; // Optional field
  // Add other properties if your DTO has them
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8089/api/users'; // Base API URL for user-related endpoints

  constructor(private http: HttpClient) { }

  /**
   * Fetches the profile of the currently authenticated user.
   * The AuthInterceptor will automatically add the JWT token to this request.
   * @returns An Observable of the UserProfileResponse.
   */
  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/me`);
  }
}
