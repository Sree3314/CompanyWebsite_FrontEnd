import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, of, BehaviorSubject, combineLatest } from 'rxjs'; // Import BehaviorSubject and combineLatest
import { catchError, tap, map, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators'; // Remove switchMap if not used for filtering directly
import { AuthService } from '../services/auth.service';
import { JobService } from '../services/job.service';
import { ApplicationService } from '../services/application.service';
import { Job, JobPostRequest } from '../models/job.model';
import { Application, ApplicationRequestDTO, ApplicationStatus } from '../models/application.model';
import { HttpErrorResponse } from '@angular/common/http';


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
  filteredJobs$: Observable<Job[]>; // Observable for filtered jobs
  jobSearchQuery: string = ''; // Search query for jobs
  // private jobsList: Job[] = []; // No longer strictly needed for filtering due to BehaviorSubject, but can keep for direct access if needed.

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

    // Initialize filteredJobs$ to react to changes in jobsSubject and jobSearchQuery
    this.filteredJobs$ = combineLatest([
      this.jobsSubject.asObservable(), // Listen to changes in the raw job list
      // Listen to changes in the search query, with debounce for performance
      of(this.jobSearchQuery).pipe(
        debounceTime(300), // Wait 300ms after last keystroke
        distinctUntilChanged(), // Only emit if the value is different
        startWith(this.jobSearchQuery) // Emit initial value
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
  }

  loadAllJobs(): void {
    this.jobService.getAllJobs().pipe(
      tap(jobs => {
        this.jobsSubject.next(jobs); // Push the new list of jobs to the subject
        // this.jobsList = jobs; // This line is now redundant for filtering, but can be kept if needed for other direct array manipulations.
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
    // The filtering logic is now handled reactively by filteredJobs$
    // We just need to trigger a change in jobSearchQuery to make it re-evaluate
    // This is implicitly handled by [(ngModel)] binding, but if you had a separate search button, this would be its handler.
  }

  /**
   * Toggles the visibility of the job posting form.
   * Hides other main sections when activated.
   */
  toggleJobPostForm(): void {
    this.showJobPostForm = !this.showJobPostForm;
    if (this.showJobPostForm) {
      this.showViewApplications = false;
      this.showMyApplications = false; // Ensure other user-related views are hidden
    }
    this.jobPostMessage = '';
    this.newJob = {
      title: '',
      description: '',
      location: '',
      salary: '',
      jobType: '',
      experienceLevel: '',
      skillsRequired: ''
    };
  }

  submitJob(): void {
    this.jobService.postJob(this.newJob).subscribe({
      next: (response) => {
        this.jobPostMessage = 'Job posted successfully!';
        console.log('Job post success!', response);
        this.toggleJobPostForm(); // Optionally hide the form after successful post
        this.loadAllJobs(); // Reload jobs to include the new one (will update jobsSubject)
      },
      error: (error: HttpErrorResponse) => {
        this.jobPostMessage = 'Error posting job: ' + (error.error?.message || 'Please try again.');
        console.error('Job post error:', error);
      }
    });
  }

  openApplyForm(job: Job): void {
    this.selectedJobForApplication = job;
    if (job.id) {
      this.applicationFormData.jobId = job.id;
      this.showApplyForm = true;
      this.applicationMessage = '';
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
  }

  submitApplication(): void {
    if (!this.selectedJobForApplication || !this.applicationFormData.jobId) {
      this.applicationMessage = 'No job selected or job ID missing for application.';
      return;
    }

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
        this.applicationMessage = 'Error submitting application: ' + (error.error?.message || 'Please try again.');
        console.error('Application error:', error);
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
      app.job.id === jobId &&
      app.employee.employeeId === this.currentUserEmployeeId
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

  // New method to update application status (for managers)
  updateApplicationStatus(applicationId: number, status: ApplicationStatus): void {
    this.applicationService.updateApplicationStatus(applicationId, status).subscribe({
      next: (response) => {
        console.log(`Application ${applicationId} status updated to ${status}`, response);
        // After successful update, reload all applications to reflect the change
        this.loadAllApplications();
        // Optionally, show a success message to the user
      },
      error: (error: HttpErrorResponse) => {
        console.error(`Error updating application ${applicationId} to ${status}:`, error);
        // Optionally, show an error message to the user
        alert('Failed to update application status. Please try again.');
      }
    });
  }

  // NEW: Method to delete a job
  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => {
          alert('Job deleted successfully!');
          // Option 1: Re-fetch all jobs (current approach, should work with BehaviorSubject)
          this.loadAllJobs();

          // Option 2 (More efficient for single deletions): Directly update the subject
          // This avoids an extra API call if you only need to remove one item.
          // const currentJobs = this.jobsSubject.getValue();
          // const updatedJobs = currentJobs.filter(job => job.id !== jobId);
          // this.jobsSubject.next(updatedJobs); // Push the updated array

        },
        error: (error: HttpErrorResponse) => {
          console.error('Error deleting job:', error);
          if (error.status === 404) {
            alert('Job not found or already deleted.');
          } else if (error.status === 403) {
            alert('You are not authorized to delete this job.');
          } else {
            alert('Failed to delete job: ' + (error.error?.message || 'Server error.'));
          }
          this.loadAllJobs(); // Attempt to reload jobs even on error to sync state
        }
      });
    }
  }
}