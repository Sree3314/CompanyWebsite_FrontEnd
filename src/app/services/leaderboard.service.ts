// src/app/services/leaderboard.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeRatingPerformance } from '../models/leaderboard.model';
// import { environment } from '../../environments/environment'; // Uncomment if you use environment files for URLs

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  // Use your actual backend URL here.
  // Example: private apiUrl = environment.backendApiUrl + '/api/leaderboard';
  private apiUrl = 'http://localhost:8089/api/leaderboard'; // Assuming your backend runs on port 8089

  constructor(private http: HttpClient) { }

  /**
   * Fetches the average project rating leaderboard from the backend.
   * @returns An Observable of a list of EmployeeRatingPerformance objects.
   */
  getAverageRatingLeaderboard(): Observable<EmployeeRatingPerformance[]> {
    console.log('Fetching average rating leaderboard from:', `${this.apiUrl}/average-ratings`);
    return this.http.get<EmployeeRatingPerformance[]>(`${this.apiUrl}/average-ratings`);
  }
}
