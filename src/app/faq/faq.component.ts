// src/app/faq/faq.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaqService } from '../services/faq.service';
import { Question, Answer, QuestionRequest, AnswerRequest } from '../models/faq.model';
import { catchError, of, tap } from 'rxjs';

// Assume a basic User service/model exists to get current user info (for authorization checks)
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-faq',
  standalone: true, // IMPORTANT: Set to true for its own imports array to work
  imports: [
    CommonModule,  // Provides *ngIf, *ngFor
    FormsModule    // Provides [(ngModel)]
  ],
  providers: [DatePipe], // Provide DatePipe here if not globally
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FAQComponent implements OnInit {
  questions: Question[] = [];
  newQuestionTitle: string = '';
  newQuestionContent: string = '';
  answerContent: { [questionId: number]: string } = {}; // Store answer content per question
  editingQuestionId: number | null = null;
  editingQuestionTitle: string = '';
  editingQuestionContent: string = '';
  editingAnswerId: number | null = null;
  editingAnswerContent: string = '';
  // Assuming the user ID and roles are available from an authentication service
  currentUserId: number | null = null; // This should be `userAutoId` from backend
  currentUserRoles: string[] = []; // e.g., ['USER', 'MANAGER', 'ADMIN']
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private faqService: FaqService,
    private authService: AuthService, // Inject AuthService
    private datePipe: DatePipe // Inject DatePipe
  ) { }

  ngOnInit(): void {
    // Get current user ID and roles after authentication is ready
    this.authService.getCurrentUserAutoId().subscribe((id: number | null) => {
      this.currentUserId = id;
    });
    this.authService.getCurrentUserRoles().subscribe((roles: string[]) => {
      this.currentUserRoles = roles;
    });

    this.loadQuestions();
  }

  /**
   * Loads all questions and their answers from the backend.
   */
  loadQuestions(): void {
    this.faqService.getAllQuestions().pipe(
      tap(data => {
        this.questions = data;
        this.questions.forEach(q => {
          // Initialize answer content for each question
          this.answerContent[q.id] = '';
        });
        this.clearMessages();
      }),
      catchError(error => {
        console.error('Error loading questions:', error);
        this.showError('Failed to load questions. Please try again.');
        return of([]); // Return an empty array to keep the observable stream alive
      })
    ).subscribe();
  }

  /**
   * Posts a new question to the backend.
   */
  postQuestion(): void {
    if (!this.newQuestionTitle.trim() || !this.newQuestionContent.trim()) {
      this.showError('Question title and content cannot be empty.');
      return;
    }

    const questionRequest: QuestionRequest = {
      title: this.newQuestionTitle,
      content: this.newQuestionContent
    };

    this.faqService.postQuestion(questionRequest).pipe(
      tap(newQuestion => {
        this.questions.unshift(newQuestion); // Add to the beginning of the list
        this.newQuestionTitle = '';
        this.newQuestionContent = '';
        this.answerContent[newQuestion.id] = ''; // Initialize answer content for the new question
        this.showSuccess('Question posted successfully!');
      }),
      catchError(error => {
        console.error('Error posting question:', error);
        this.showError('Failed to post question. Please ensure you are logged in and try again.');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Initiates the editing process for a question.
   * @param question The question to edit.
   */
  editQuestion(question: Question): void {
    this.editingQuestionId = question.id;
    this.editingQuestionTitle = question.title;
    this.editingQuestionContent = question.content;
    this.clearMessages();
  }

  /**
   * Saves the updated question.
   */
  saveEditedQuestion(): void {
    if (this.editingQuestionId === null || !this.editingQuestionTitle.trim() || !this.editingQuestionContent.trim()) {
      this.showError('Edited question title and content cannot be empty.');
      return;
    }

    const updatedQuestionRequest: QuestionRequest = {
      title: this.editingQuestionTitle,
      content: this.editingQuestionContent
    };

    this.faqService.updateQuestion(this.editingQuestionId, updatedQuestionRequest).pipe(
      tap(updatedQuestion => {
        const index = this.questions.findIndex(q => q.id === updatedQuestion.id);
        if (index !== -1) {
          this.questions[index] = updatedQuestion; // Update the question in the local array
        }
        this.cancelEditQuestion();
        this.showSuccess('Question updated successfully!');
      }),
      catchError(error => {
        console.error('Error updating question:', error);
        this.showError('Failed to update question. You might not have permission.');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Cancels the question editing process.
   */
  cancelEditQuestion(): void {
    this.editingQuestionId = null;
    this.editingQuestionTitle = '';
    this.editingQuestionContent = '';
    this.clearMessages();
  }

  /**
   * Deletes a question from the backend.
   * @param questionId The ID of the question to delete.
   */
  deleteQuestion(questionId: number): void {
    if (confirm('Are you sure you want to delete this question and all its answers?')) {
      this.faqService.deleteQuestion(questionId).pipe(
        tap(() => {
          this.questions = this.questions.filter(q => q.id !== questionId);
          this.showSuccess('Question deleted successfully!');
        }),
        catchError(error => {
          console.error('Error deleting question:', error);
          this.showError('Failed to delete question. You might not have permission.');
          return of(null);
        })
      ).subscribe();
    }
  }

  /**
   * Posts a new answer to a specific question.
   * @param questionId The ID of the question to answer.
   */
  postAnswer(questionId: number): void {
    const answerContent = this.answerContent[questionId];
    if (!answerContent || !answerContent.trim()) {
      this.showError('Answer content cannot be empty.');
      return;
    }

    const answerRequest: AnswerRequest = { content: answerContent };

    this.faqService.postAnswer(questionId, answerRequest).pipe(
      tap(newAnswer => {
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
          question.answers.push(newAnswer); // Add new answer to the question's answers
        }
        this.answerContent[questionId] = ''; // Clear the input field for this question
        this.showSuccess('Answer posted successfully!');
      }),
      catchError(error => {
        console.error('Error posting answer:', error);
        this.showError('Failed to post answer. Please ensure you are logged in and try again.');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Initiates the editing process for an answer.
   * @param answer The answer to edit.
   */
  editAnswer(answer: Answer): void {
    this.editingAnswerId = answer.id;
    this.editingAnswerContent = answer.content;
    this.clearMessages();
  }

  /**
   * Saves the updated answer.
   * @param questionId The ID of the parent question.
   */
  saveEditedAnswer(questionId: number): void {
    if (this.editingAnswerId === null || !this.editingAnswerContent.trim()) {
      this.showError('Edited answer content cannot be empty.');
      return;
    }

    const updatedAnswerRequest: AnswerRequest = { content: this.editingAnswerContent };

    this.faqService.updateAnswer(this.editingAnswerId, updatedAnswerRequest).pipe(
      tap(updatedAnswer => {
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
          const index = question.answers.findIndex((a: Answer) => a.id === updatedAnswer.id);
          if (index !== -1) {
            question.answers[index] = updatedAnswer; // Update the answer in the local array
          }
        }
        this.cancelEditAnswer();
        this.showSuccess('Answer updated successfully!');
      }),
      catchError(error => {
        console.error('Error updating answer:', error);
        this.showError('Failed to update answer. You might not have permission.');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Cancels the answer editing process.
   */
  cancelEditAnswer(): void {
    this.editingAnswerId = null;
    this.editingAnswerContent = '';
    this.clearMessages();
  }

  /**
   * Deletes an answer from the backend.
   * @param questionId The ID of the parent question.
   * @param answerId The ID of the answer to delete.
   */
  deleteAnswer(questionId: number, answerId: number): void {
    if (confirm('Are you sure you want to delete this answer?')) {
      this.faqService.deleteAnswer(answerId).pipe(
        tap(() => {
          const question = this.questions.find(q => q.id === questionId);
          if (question) {
            question.answers = question.answers.filter((a: Answer) => a.id !== answerId);
          }
          this.showSuccess('Answer deleted successfully!');
        }),
        catchError(error => {
          console.error('Error deleting answer:', error);
          this.showError('Failed to delete answer. You might not have permission.');
          return of(null);
        })
      ).subscribe();
    }
  }

  /**
   * Checks if the current user is the owner of the question/answer.
   * This is a client-side check for UI display; backend will enforce security.
   * @param userExternalId The external employee ID of the question/answer owner.
   * @returns True if the current user is the owner, false otherwise.
   */
  isOwner(userExternalId: number): boolean {
    return this.currentUserId !== null && this.currentUserId === userExternalId;
  }

  /**
   * Checks if the current user has the 'ADMIN' role.
   * @returns True if the user is an ADMIN, false otherwise.
   */
  isAdmin(): boolean {
    return this.currentUserRoles.includes('ADMIN');
  }

  /**
   * Formats a date string.
   * @param dateString The date string to format.
   * @returns Formatted date string or empty string if null.
   */
  formatDate(dateString: string | null): string {
    return dateString ? this.datePipe.transform(dateString, 'medium') || '' : '';
  }

  /**
   * Displays an error message.
   * @param message The error message to display.
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => this.errorMessage = null, 5000); // Clear after 5 seconds
  }

  /**
   * Displays a success message.
   * @param message The success message to display.
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    setTimeout(() => this.successMessage = null, 5000); // Clear after 5 seconds
  }

  /**
   * Clears all messages.
   */
  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}
