import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UploadRequest, UploadDTO } from '../models/upload.model';
// import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = 'http://localhost:8089/api/uploads';

  constructor(private http: HttpClient) { }

  createUpload(uploadRequest: UploadRequest): Observable<UploadDTO> {
    console.log('Sending upload request:', uploadRequest);
    return this.http.post<UploadDTO>(this.apiUrl, uploadRequest);
  }

  getMyUploads(): Observable<UploadDTO[]> {
    console.log('Fetching user uploads from:', `${this.apiUrl}/my-uploads`);
    return this.http.get<UploadDTO[]>(`${this.apiUrl}/my-uploads`);
  }

  /**
   * Sends a DELETE request to remove an upload by its ID.
   * @param uploadId The ID of the upload to delete.
   * @returns An Observable that completes when the deletion is successful (no specific data returned).
   */
  deleteUpload(uploadId: string): Observable<void> {
    const url = `${this.apiUrl}/${uploadId}`;
    console.log('Deleting upload from:', url);
    return this.http.delete<void>(url); // <void> indicates no response body is expected
  }
}