// src/app/components/leaderboard/leaderboard.component.ts
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { LeaderboardService } from '../services/leaderboard.service';
import { EmployeeRatingPerformance } from '../models/leaderboard.model';
import { finalize } from 'rxjs/operators'; // For loading indicator

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
  imports:[CommonModule,FormsModule] // You can add component-specific CSS here
})
export class LeaderboardComponent implements OnInit {
  leaderboardData: EmployeeRatingPerformance[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private leaderboardService: LeaderboardService) { }

  ngOnInit(): void {
    this.fetchLeaderboard();
  }

  fetchLeaderboard(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.leaderboardService.getAverageRatingLeaderboard()
      .pipe(
        finalize(() => this.isLoading = false) // Set loading to false when observable completes or errors
      )
      .subscribe({
        next: (data) => {
          this.leaderboardData = data;
          console.log('Leaderboard data fetched:', this.leaderboardData);
        },
        error: (error) => {
          console.error('Error fetching leaderboard:', error);
          this.errorMessage = 'Failed to load leaderboard data. Please try again later.';
        }
      });
  }
}
