/**
 * Interface for the request body when creating a new upload.
 * This matches the 'UploadRequest' DTO on your Spring Boot backend.
 */
export interface UploadRequest {
    title: string;
    description: string;
    projectDuration: string;
    fileUrl: string; // URL to the uploaded file/resource (e.g., a Google Drive link, a demo site URL)
    startedDate: string; // Expected format: 'YYYY-MM-DD' for LocalDate in Java
    endDate: string;     // Expected format: 'YYYY-MM-DD' for LocalDate in Java
    externalEmployeeId: number; // The employee ID of the user performing the upload
  }
  
  /**
   * Interface for the data received when fetching upload details.
   * This matches the 'UploadDTO' on your Spring Boot backend.
   */
  export interface UploadDTO {
    id: string; // The unique ID of the upload (assuming it's a String from backend)
    title: string;
    description: string;
    uploaderFirstName: string; // First name of the employee who uploaded this work
    uploaderLastName: string;  // Last name of the employee who uploaded this work
    uploadDate: string;        // Date when the work was uploaded (e.g., 'YYYY-MM-DD')
    fileUrl: string;
    projectDuration: string;
    rating?: number; // Optional: Rating given to the upload (e.g., by a manager)
    comment?: string; // Optional: Comments related to the upload
    startedDate: string;
    endDate: string;
    externalEmployeeId: number; // The employee ID of the user associated with this upload
  }