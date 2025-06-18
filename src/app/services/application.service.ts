import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application, ApplicationRequestDTO, ApplicationStatus } from '../models/application.model';
import { AuthService } from './auth.service'; // To get the JWT token

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = 'http://localhost:8089/api/applications'; // Base URL for application endpoints

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Submits a new job application.
   * @param applicationData The data for the new application.
   * @returns An Observable for the HTTP POST request.
   */
  applyForJob(applicationData: ApplicationRequestDTO): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // As per previous discussions, assuming backend sends "no json body" on success for POST
    return this.http.post<any>(this.apiUrl, applicationData, { headers });
  }

  /**
   * Retrieves all applications submitted by a specific employee.
   * @param employeeId The ID of the employee.
   * @returns An Observable array of Applications.
   */
  getApplicationsByEmployee(employeeId: number): Observable<Application[]> {
    console.log(`Fetching applications for employee ID: ${employeeId}`);
    const headers = this.authService.getToken() ? { Authorization: `Bearer ${this.authService.getToken()}` } : new HttpHeaders();
    return this.http.get<Application[]>(`${this.apiUrl}/employee/${employeeId}`, { headers });
  }

  /**
   * Retrieves all applications for a specific job.
   * @param jobId The ID of the job.
   * @returns An Observable array of Applications.
   */
  getApplicationsByJob(jobId: number): Observable<Application[]> {
    const headers = this.authService.getToken() ? { Authorization: `Bearer ${this.authService.getToken()}` } : new HttpHeaders();
    return this.http.get<Application[]>(`${this.apiUrl}/job/${jobId}`, { headers });
  }

  /**
   * Updates the status of a specific application.
   * @param applicationId The ID of the application to update.
   * @param status The new status for the application.
   * @returns An Observable for the HTTP PUT request.
   */
  updateApplicationStatus(applicationId: number, status: ApplicationStatus): Observable<any> {
    const headers = this.authService.getToken() ? { Authorization: `Bearer ${this.authService.getToken()}` } : new HttpHeaders();
    return this.http.put<any>(`${this.apiUrl}/${applicationId}/status?status=${status}`, {}, { headers });
  }

  /**
   * NEW METHOD: Retrieves all job applications (typically for managers).
   * @returns An Observable array of all Applications.
   */
  getAllApplications(): Observable<Application[]> {
    const headers = this.authService.getToken() ? { Authorization: `Bearer ${this.authService.getToken()}` } : new HttpHeaders();
    // Assuming your backend endpoint for all applications is `${this.apiUrl}/all` or just `${this.apiUrl}`
    // I'm using `${this.apiUrl}` as it's a common RESTful practice for getting a collection.
    // If your backend specifically uses `/all`, change this to `${this.apiUrl}/all`.
    return this.http.get<Application[]>(this.apiUrl, { headers });
  }
  updateStatus(applicationId: number, status: string): Observable<any> {
    const url = `${this.apiUrl}/${applicationId}/status`;
    return this.http.put(url, { status });
  }
}
