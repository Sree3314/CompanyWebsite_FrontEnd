// src/app/services/job.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job, JobPostRequest } from '../models/job.model'; // Import JobPostRequest
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:8089/api/jobs'; // Your backend API endpoint for jobs

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Method to get all job listings
  getAllJobs(): Observable<Job[]> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<Job[]>(this.apiUrl, { headers: headers });
  }

  // NEW METHOD: For managers to post a new job
  postJob(job: JobPostRequest): Observable<Job> { // Expecting a full Job object back
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post<Job>(this.apiUrl, job, { headers: headers });
  }

  // NEW METHOD: For managers to delete a job
  deleteJob(jobId: number): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete(`${this.apiUrl}/${jobId}`, { headers: headers });
  }
}