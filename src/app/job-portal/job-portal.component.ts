// job-portal.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, of, BehaviorSubject, combineLatest } from 'rxjs'; // Import BehaviorSubject and combineLatest
import { catchError, tap, map, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { JobService } from '../services/job.service';
import { ApplicationService } from '../services/application.service';
import { Job, JobPostRequest } from '../models/job.model';
import { Application, ApplicationRequestDTO, ApplicationStatus } from '../models/application.model';
import { HttpErrorResponse } from '@angular/common/http';

// Assuming JobPostErrors is defined as shown above, perhaps in job.model.ts or here:
interface JobPostErrors {
  title?: string;
  description?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  skillsRequired?: string;
  managerId?: string;
  // Add any other fields that might return errors from your backend
}
interface ApplicationFormErrors {
  resumeLink?: string;
  skills?: string;
  yearsOfExperience?: string;
  // Add any other fields that might return errors from your backend
}
@Component({
  selector: 'app-job-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-portal.component.html',
  styleUrl: './job-portal.component.css'
})
export class JobPortalComponent implements OnInit, OnDestroy {
  isUser: boolean = false;
  isManager: boolean = false;

  // Jobs
  private jobsSubject = new BehaviorSubject<Job[]>([]); // NEW: Source of truth for all jobs
  jobs$: Observable<Job[]>; // Expose as Observable

  // --- START OF JOB SEARCH FIX ---
  // Keep jobSearchQuery for [(ngModel)] binding in the template
  jobSearchQuery: string = '';
  // NEW: Subject to emit changes from the search input
  private jobSearchQuerySubject = new BehaviorSubject<string>('');
  filteredJobs$: Observable<Job[]>; // Observable for filtered jobs
  // --- END OF JOB SEARCH FIX ---

  // Applications
  allApplications: Application[] = [];
  filteredApplications: Application[] = []; // Filtered applications for manager view
  applicationSearchQuery: string = ''; // Search query for applications

  private userRolesSubscription: Subscription | undefined;

  // For Job Posting (Manager Role)
  showJobPostForm: boolean = false;
  newJob: JobPostRequest = {
    title: '',
    description: '',
    location: '',
    salary: '',
    jobType: '',
    experienceLevel: '',
    skillsRequired: ''
  };
  jobPostMessage: string = '';
  jobFormErrors: JobPostErrors = {}; // This object will hold your field-specific errors
  // For Apply Now functionality (User Role)
  showApplyForm: boolean = false;
  selectedJobForApplication: Job | null = null;
  applicationFormData: ApplicationRequestDTO = {
    jobId: 0,
    resumeLink: '',
    skills: '',
    yearsOfExperience: 0
  };
  applicationMessage: string = '';
  applicationFormErrors: ApplicationFormErrors = {}; // Errors for the application form

  salaryRanges: string[] = ['4-6 Lakhs INR', '6-9 Lakhs INR', '9-12 Lakhs INR', '12-15 Lakhs INR', '15-20 Lakhs INR', '20+ Lakhs INR'];
  // To track user's own applications to disable 'Apply Now' button
  private myApplicationsSubject = new BehaviorSubject<Application[]>([]); // NEW: Source of truth for user's applications
  myApplications$: Observable<Application[]>; // Expose as Observable
  private currentUserEmployeeId: number | null = null;

  // For Manager to view all applications
  showViewApplications: boolean = false;

  // For User to view their own applications
  showMyApplications: boolean = false; // Flag to control visibility of "My Applications"

  // Expose ApplicationStatus enum to the template (THIS IS CRUCIAL FOR HTML ACCESS)
  public ApplicationStatus = ApplicationStatus;


  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService
  ) {
    this.jobs$ = this.jobsSubject.asObservable(); // Initialize jobs$ from the subject
    this.myApplications$ = this.myApplicationsSubject.asObservable(); // Initialize myApplications$ from its subject

    // Initialize filteredJobs$ to react to changes in jobsSubject and jobSearchQuerySubject
    this.filteredJobs$ = combineLatest([
      this.jobsSubject.asObservable(), // Listen to changes in the raw job list
      // Listen to changes in the search query from the new subject
      this.jobSearchQuerySubject.asObservable().pipe( // Changed from of(this.jobSearchQuery)
        debounceTime(300), // Wait 300ms after last keystroke
        distinctUntilChanged(), // Only emit if the value is different
        startWith('') // Emit initial empty string, as no query is typed initially
      )
    ]).pipe(
      map(([jobs, query]) => {
        const lowerCaseQuery = (query as string).toLowerCase().trim();
        if (lowerCaseQuery) {
          return jobs.filter(job =>
            job.title.toLowerCase().includes(lowerCaseQuery) ||
            job.location.toLowerCase().includes(lowerCaseQuery) ||
            job.description.toLowerCase().includes(lowerCaseQuery) ||
            job.skillsRequired.toLowerCase().includes(lowerCaseQuery)
          );
        } else {
          return jobs; // If no query, show all jobs
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error filtering jobs:', error);
        return of([]);
      })
    );
  }

  ngOnInit(): void {
    this.userRolesSubscription = this.authService.getCurrentUserRoles().subscribe(roles => {
      this.isUser = roles.includes('USER');
      this.isManager = roles.includes('MANAGER');
      console.log('Current User Roles:', roles, 'isUser:', this.isUser, 'isManager:', this.isManager);

      this.authService.getCurrentUserAutoId().subscribe(id => {
        this.currentUserEmployeeId = id;
        if (this.isUser && this.currentUserEmployeeId) {
          // Initial load of user's applications should happen when 'My Applications' is clicked or on specific need
        }
      });

      this.loadAllJobs(); // Initial load of all jobs for display
      if (this.isManager) {
        this.showJobPostForm = false; // Ensure it's false by default
        this.showViewApplications = false; // Ensure it's false by default
        // No initial load of all applications here, it will be loaded when toggleViewApplications is called
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userRolesSubscription) {
      this.userRolesSubscription.unsubscribe();
    }
    this.jobsSubject.complete(); // Clean up subjects
    this.myApplicationsSubject.complete();
    this.jobSearchQuerySubject.complete(); // NEW: Clean up the jobSearchQuerySubject
  }

  loadAllJobs(): void {
    this.jobService.getAllJobs().pipe(
      tap(jobs => {
        this.jobsSubject.next(jobs); // Push the new list of jobs to the subject
        console.log('Loaded All Jobs:', jobs);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading all jobs:', error);
        this.jobsSubject.next([]); // Emit empty array on error
        return of([]);
      })
    ).subscribe(); // Subscribe to trigger the API call and update subject
  }

  // Method to filter jobs based on search query
  onJobSearch(): void {
    // NEW: Emit the current value of the input field to the subject
    this.jobSearchQuerySubject.next(this.jobSearchQuery);
  }

  /**
   * Toggles the visibility of the job posting form.
   * Hides other main sections when activated.
   */
  toggleJobPostForm(): void {
    this.showJobPostForm = !this.showJobPostForm;
    if (this.showJobPostForm) {
      this.showViewApplications = false;
      this.showMyApplications = false;
    }
    this.jobPostMessage = '';
    // Reset form and errors when toggling or opening the form
    this.newJob = {
      title: '',
      description: '',
      location: '',
      salary: '',
      jobType: '',
      experienceLevel: '',
      skillsRequired: ''
    };
    this.jobFormErrors = {}; // NEW: Clear all errors when form is closed or opened
  }

  submitJob(): void {
    this.jobPostMessage = ''; // Clear previous general messages
    this.jobFormErrors = {}; // Clear previous field-specific errors

    this.jobService.postJob(this.newJob).subscribe({
      next: (response) => {
        this.jobPostMessage = 'Job posted successfully!';
        console.log('Job post success!', response);
        this.toggleJobPostForm(); // Optionally hide the form after successful post
        this.loadAllJobs(); // Reload jobs to include the new one (will update jobsSubject)
      },
      error: (error: HttpErrorResponse) => {
        console.error('Job post error:', error);
        // Set a general error message
        this.jobPostMessage = 'Failed to post job. Please check the form for errors below.';

        // Check if the error response contains field-specific errors
        if (error.status === 400 && error.error && typeof error.error === 'object') {
          // Assuming the backend sends errors like:
          // { experienceLevel: 'Experience level cannot be empty', skillsRequired: 'Skills required cannot be empty', ... }
          this.jobFormErrors = error.error as JobPostErrors;
        } else {
          // Fallback for other types of errors or unexpected format
          this.jobPostMessage = 'Error posting job: ' + (error.error?.message || error.message || 'An unexpected error occurred. Please try again.');
        }
      }
    });
  }

  openApplyForm(job: Job): void {
    this.selectedJobForApplication = job;
    if (job.id) {
      this.applicationFormData.jobId = job.id;
      this.showApplyForm = true;
      this.applicationMessage = ''; // Clear previous messages
      this.applicationFormErrors = {}; // Clear previous errors
    } else {
      console.error('Job ID is missing for selected job:', job);
      this.applicationFormData = { jobId: 0, resumeLink: '', skills: '', yearsOfExperience: 0 };
      this.applicationMessage = 'Error: Cannot apply, job ID is missing.';
    }
  }

  closeApplyForm(): void {
    this.showApplyForm = false;
    this.selectedJobForApplication = null;
    this.applicationFormData = { jobId: 0, resumeLink: '', skills: '', yearsOfExperience: 0 };
    this.applicationMessage = ''; // Clear message on close
    this.applicationFormErrors = {}; // Clear errors on close
  }

  submitApplication(): void {
    if (!this.selectedJobForApplication || !this.applicationFormData.jobId) {
      this.applicationMessage = 'No job selected or job ID missing for application.';
      return;
    }

    this.applicationMessage = ''; // Clear previous general messages
    this.applicationFormErrors = {}; // Clear previous field-specific errors

    this.applicationService.applyForJob(this.applicationFormData).subscribe({
      next: (response) => {
        this.applicationMessage = 'Application submitted successfully!';
        console.log('Application success (response might be empty):', response);
        this.closeApplyForm();
        if (this.currentUserEmployeeId) {
          this.loadMyApplications(this.currentUserEmployeeId); // Reload user's applications
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Application error:', error);
        // Set a general error message
        this.applicationMessage = 'Error submitting application. Please check the form for errors below.';

        // Check if the error response contains field-specific errors
        if (error.status === 400 && error.error && typeof error.error === 'object') {
          this.applicationFormErrors = error.error as ApplicationFormErrors;
        } else {
          // Fallback for other types of errors or unexpected format
          this.applicationMessage = 'Error submitting application: ' + (error.error?.message || error.message || 'An unexpected error occurred. Please try again.');
        }
      }
    });
  }

  loadMyApplications(employeeId: number): void {
    this.applicationService.getApplicationsByEmployee(employeeId).pipe(
      tap(applications => {
        this.myApplicationsSubject.next(applications); // Push to subject
        console.log('Loaded My Applications:', applications);
      }),
      catchError(error => {
        console.error('Error loading my applications:', error);
        this.myApplicationsSubject.next([]); // Emit empty array on error
        return of([]);
      })
    ).subscribe(); // Subscribe to trigger the API call and update subject
  }

  hasApplied(jobId: number): boolean {
    // Access the current value of the BehaviorSubject directly for immediate check
    const applications = this.myApplicationsSubject.getValue();
    return applications.some(app =>
      app.job?.id === jobId && // Use optional chaining here as job can be null initially
      app.employee?.employeeId === this.currentUserEmployeeId // Use optional chaining here
    );
  }

  /**
   * Toggles the visibility of the "All Applications" section for managers.
   * Hides other main sections when activated.
   */
  toggleViewApplications(): void {
    this.showViewApplications = !this.showViewApplications;
    if (this.showViewApplications) {
      this.showJobPostForm = false;
      this.showMyApplications = false; // Ensure user-related views are hidden
      this.loadAllApplications(); // Load applications when showing the view
    }
  }

  loadAllApplications(): void {
    this.applicationService.getAllApplications().pipe(
      tap(applications => {
        this.allApplications = applications; // Store the original list
        this.onApplicationSearch(); // Apply initial filter (empty query means show all)
        console.log('Loaded All Applications (Manager):', applications);
      }),
      catchError(error => {
        console.error('Error loading all applications:', error);
        return of([]);
      })
    ).subscribe(); // Subscribe here to trigger the tap and error handling
  }

  // Method to filter applications based on search query
  onApplicationSearch(): void {
    const query = this.applicationSearchQuery.toLowerCase().trim();
    if (query) {
      this.filteredApplications = this.allApplications.filter(app =>
        app.employee?.firstName.toLowerCase().includes(query) ||
        app.employee?.lastName.toLowerCase().includes(query) ||
        app.job?.title.toLowerCase().includes(query) ||
        app.skills.toLowerCase().includes(query)
      );
    } else {
      this.filteredApplications = this.allApplications; // If no query, show all
    }
  }

  /**
   * Method to show the "Available Jobs" section for managers.
   * This will hide other manager-specific views.
   */
  showAvailableJobsForManager(): void {
    this.showJobPostForm = false;
    this.showViewApplications = false;
    this.showMyApplications = false; // Ensure user-specific view is also hidden if manager
    this.loadAllJobs(); // Re-load or ensure jobs are loaded (will update jobsSubject)
  }

  // New method to toggle My Applications view for users
  toggleMyApplications(): void {
    this.showMyApplications = !this.showMyApplications;
    if (this.showMyApplications) {
      this.showJobPostForm = false;
      this.showViewApplications = false;
      if (this.currentUserEmployeeId) {
        this.loadMyApplications(this.currentUserEmployeeId);
      }
    }
  }

  /**
   * Updates the status of a specific application with optimistic UI update.
   * @param applicationId The ID of the application to update.
   * @param newStatus The new status (ACCEPTED or DECLINED).
   */
  updateApplicationStatus(applicationId: number, newStatus: ApplicationStatus): void {
    const applicationIndex = this.allApplications.findIndex(app => app.id === applicationId);

    if (applicationIndex > -1) {
      const originalStatus = this.allApplications[applicationIndex].status;

      // Optimistic UI update: Update the status immediately in the local arrays
      this.allApplications[applicationIndex].status = newStatus;
      this.onApplicationSearch(); // Re-filter to update filteredApplications with the new status

      this.applicationService.updateApplicationStatus(applicationId, newStatus).subscribe({
        next: (response) => {
          console.log(`Application ${applicationId} status updated to ${newStatus}`, response);
          // UI is already updated, no need to reload allApplications fully unless there's more complex state.
          // If the status change needs to affect other parts of the app (e.g., job counts), you might trigger other loads.
        },
        error: (error: HttpErrorResponse) => {
          console.error(`Error updating application ${applicationId} to ${newStatus}:`, error);
          // Revert optimistic update on error
          this.allApplications[applicationIndex].status = originalStatus;
          this.onApplicationSearch(); // Re-filter to revert filteredApplications
          console.log('Failed to update application status. Please try again.'); // User feedback
        }
      });
    } else {
      console.warn(`Application with ID ${applicationId} not found in local array for status update.`);
    }
  }

  // NEW: Method to delete a job
  deleteJob(jobId: number): void {
    // In a production app, use a custom modal for confirmation instead of `confirm()`.
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => {
          console.log('Job deleted successfully!');
          // Optimistically remove the job from the local list
          const currentJobs = this.jobsSubject.getValue();
          const updatedJobs = currentJobs.filter(job => job.id !== jobId);
          this.jobsSubject.next(updatedJobs); // Update the BehaviorSubject which will re-filter filteredJobs$
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error deleting job:', error);
          let errorMessage = 'Failed to delete job.';
          if (error.status === 404) {
            errorMessage = 'Job not found or already deleted.';
          } else if (error.status === 403) {
            errorMessage = 'You are not authorized to delete this job.';
          } else {
            errorMessage += ` Server error: ${error.error?.message || error.message}`;
          }
          console.log(errorMessage); // User feedback
          this.loadAllJobs(); // Fallback to reload all jobs to sync state if optimistic fails or a broader issue occurs
        }
      });
    }
  }
}