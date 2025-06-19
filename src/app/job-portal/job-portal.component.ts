import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, of, BehaviorSubject, combineLatest } from 'rxjs';
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

// NEW: Define a type for Application form errors
interface ApplicationFormErrors {
  resumeLink?: string;
  skills?: string;
  yearsOfExperience?: string;
  // Add any other fields that might return errors from your backend for application
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
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  jobs$: Observable<Job[]>;
  filteredJobs$: Observable<Job[]>;
  jobSearchQuery: string = '';

  // Applications
  allApplications: Application[] = [];
  filteredApplications: Application[] = [];
  applicationSearchQuery: string = '';

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
  jobFormErrors: JobPostErrors = {};

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
  // NEW: Property to store application form errors
  applicationFormErrors: ApplicationFormErrors = {};


  // To track user's own applications to disable 'Apply Now' button
  private myApplicationsSubject = new BehaviorSubject<Application[]>([]);
  myApplications$: Observable<Application[]>;
  private currentUserEmployeeId: number | null = null;

  // For Manager to view all applications
  showViewApplications: boolean = false;

  // For User to view their own applications
  showMyApplications: boolean = false;

  // Expose ApplicationStatus enum to the template (THIS IS CRUCIAL FOR HTML ACCESS)
  public ApplicationStatus = ApplicationStatus;


  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService
  ) {
    this.jobs$ = this.jobsSubject.asObservable();
    this.myApplications$ = this.myApplicationsSubject.asObservable();

    this.filteredJobs$ = combineLatest([
      this.jobsSubject.asObservable(),
      of(this.jobSearchQuery).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith(this.jobSearchQuery)
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
          return jobs;
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

      this.loadAllJobs();
      if (this.isManager) {
        this.showJobPostForm = false;
        this.showViewApplications = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userRolesSubscription) {
      this.userRolesSubscription.unsubscribe();
    }
    this.jobsSubject.complete();
    this.myApplicationsSubject.complete();
  }

  loadAllJobs(): void {
    this.jobService.getAllJobs().pipe(
      tap(jobs => {
        this.jobsSubject.next(jobs);
        console.log('Loaded All Jobs:', jobs);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading all jobs:', error);
        this.jobsSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  onJobSearch(): void {
    // The filtering logic is now handled reactively by filteredJobs$
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
    this.jobFormErrors = {};
  }
  submitJob(): void {
    this.jobPostMessage = '';
    this.jobFormErrors = {};

    this.jobService.postJob(this.newJob).subscribe({
      next: (response) => {
        this.jobPostMessage = 'Job posted successfully!';
        console.log('Job post success!', response);
        this.toggleJobPostForm();
        this.loadAllJobs();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Job post error:', error);
        if (error.status === 400 && error.error) {
          this.jobFormErrors = error.error as JobPostErrors;
          this.jobPostMessage = 'Please correct the errors in the form.';
        } else {
          this.jobPostMessage = 'Error posting job: ' + (error.error?.message || 'An unexpected error occurred. Please try again.');
        }
      }
    });
  }


  openApplyForm(job: Job): void {
    this.selectedJobForApplication = job;
    if (job.id) {
      this.applicationFormData.jobId = job.id;
      this.showApplyForm = true;
      this.applicationMessage = '';
      this.applicationFormErrors = {}; // NEW: Clear previous application form errors when opening
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
    this.applicationFormErrors = {}; // NEW: Clear errors when closing the form
  }

  submitApplication(): void {
    if (!this.selectedJobForApplication || !this.applicationFormData.jobId) {
      this.applicationMessage = 'No job selected or job ID missing for application.';
      return;
    }

    this.applicationMessage = ''; // NEW: Clear general message before new submission
    this.applicationFormErrors = {}; // NEW: Clear previous field-specific errors

    this.applicationService.applyForJob(this.applicationFormData).subscribe({
      next: (response) => {
        this.applicationMessage = 'Application submitted successfully!';
        console.log('Application success (response might be empty):', response);
        this.closeApplyForm();
        if (this.currentUserEmployeeId) {
          this.loadMyApplications(this.currentUserEmployeeId);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Application error:', error);
        if (error.status === 400 && error.error) {
          // Assuming error.error is the object with field-specific messages from the backend
          this.applicationFormErrors = error.error as ApplicationFormErrors; // Cast to the new error type
          this.applicationMessage = 'Please correct the errors in your application.';
        } else {
          this.applicationMessage = 'Error submitting application: ' + (error.error?.message || 'Please try again.');
        }
      }
    });
  }

  loadMyApplications(employeeId: number): void {
    this.applicationService.getApplicationsByEmployee(employeeId).pipe(
      tap(applications => {
        this.myApplicationsSubject.next(applications);
        console.log('Loaded My Applications:', applications);
      }),
      catchError(error => {
        console.error('Error loading my applications:', error);
        this.myApplicationsSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  hasApplied(jobId: number): boolean {
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
      this.showMyApplications = false;
      this.loadAllApplications();
    }
  }

  loadAllApplications(): void {
    this.applicationService.getAllApplications().pipe(
      tap(applications => {
        this.allApplications = applications;
        this.onApplicationSearch();
        console.log('Loaded All Applications (Manager):', applications);
      }),
      catchError(error => {
        console.error('Error loading all applications:', error);
        return of([]);
      })
    ).subscribe();
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
      this.filteredApplications = this.allApplications;
    }
  }

  /**
   * Method to show the "Available Jobs" section for managers.
   * This will hide other manager-specific views.
   */
  showAvailableJobsForManager(): void {
    this.showJobPostForm = false;
    this.showViewApplications = false;
    this.showMyApplications = false;
    this.loadAllJobs();
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
        this.loadAllApplications();
      },
      error: (error: HttpErrorResponse) => {
        console.error(`Error updating application ${applicationId} to ${status}:`, error);
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
          this.loadAllJobs();
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
          this.loadAllJobs();
        }
      });
    }
  }
}