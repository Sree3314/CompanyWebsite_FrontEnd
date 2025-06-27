// src/app/models/leaderboard.model.ts

/**
 * Interface representing a single entry in the average rating leaderboard.
 * Matches the com.example.MainProject.dto.EmployeeRatingPerformanceDTO from the backend.
 */
export interface EmployeeRatingPerformance {
    employeeId: number;
    firstName: string;
    lastName: string;
    averageRating: number;
  }
  