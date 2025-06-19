// src/app/models/application.model.ts

import { Job } from './job.model'; // IMPORTANT: Ensure this path is correct and Job interface exists
import { User } from './user.model'; // IMPORTANT: Ensure this path is correct and User interface exists

// Enum for application statuses
export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
}

// Interface for what you SEND to the backend when applying (matches ApplicationDTO.java)
export interface ApplicationRequestDTO {
  jobId: number;
  resumeLink: string;
  skills: string;
  yearsOfExperience: number;
}

// Interface for what you RECEIVE from the backend when fetching applications
// This now mirrors your backend Application entity more closely
export interface Application {
  id: number;
  job: Job; // This will now be the full Job object
  employee: User; // This will now be the full User object
  resumeLink: string;
  skills: string;
  yearsOfExperience: number;
  status: ApplicationStatus;
  appliedDate: string; // Date string (e.g., "YYYY-MM-DDTHH:MM:SSZ")
  employeeName?: string; // Include if your backend sends this for display
}

/*
  NOTE: You MUST have corresponding Job and User interfaces in your models folder.
  For example:

  // src/app/models/job.model.ts (Example - adjust to your actual Job model)
  export interface Job {
    id: number;
    title: string;
    description: string;
    location: string;
    salary: string;
    jobType: string;
    experienceLevel: string;
    skillsRequired: string;
    postedDate: string; // or Date if you parse it
  }

  // src/app/models/user.model.ts (Example - adjust to your actual User model)
  export interface User {
    employeeId: number; // Or 'id' if that's the primary key
    firstName: string;
    lastName: string;
    email: string;
    contactInformation?: string;
    department?: string;
    jobTitle?: string;
    accountStatus?: string;
    role?: string; // Or string[] if multiple roles
    profilePictureUrl?: string;
    personalEmail?: string;
  }
*/
