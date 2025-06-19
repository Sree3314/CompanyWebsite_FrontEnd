// src/app/models/job.model.ts

// Interface for what you SEND when posting a new job (matches your JobDTO.java)
export interface JobPostRequest {
    title: string;
    description: string;
    location: string;
    salary: string;
    jobType: string;
    experienceLevel: string;
    skillsRequired: string;
    // managerId is handled by backend, so not included here for posting
  }
  
  // Interface for what you RECEIVE when fetching a job or after posting.
  // The backend adds 'id', 'postedDate', and 'managerId' to the response.
  export interface Job {
    id: number; // Auto-incremented by backend
    title: string;
    description: string;
    location: string;
    salary: string;
    jobType: string;
    experienceLevel: string;
    skillsRequired: string;
    postedDate: string; // Backend sends this date directly (e.g., "YYYY-MM-DDTHH:MM:SSZ")
    managerId: number; // Backend sends this manager ID directly
  }