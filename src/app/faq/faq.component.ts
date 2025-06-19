// src/app/faq/faq.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaqService } from '../services/faq.service';
import { AuthService } from '../services/auth.service';
import { Observable, forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Question, Answer, QuestionRequest, AnswerRequest } from '../models/faq.model';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit {
  questions: Question[] = [];

  // General messages (will auto-disappear except for specific "cannot be empty" server errors)
  _errorMessage: string | null = null;
  _successMessage: string | null = null;

  // Specific message for validation errors within the cards
  cardErrorMessage: string | null = null;

  // Timers for general messages
  private errorTimeout: any;
  private successTimeout: any;

  // Public getters/setters for general messages to trigger setTimeout
  get errorMessage(): string | null {
    return this._errorMessage;
  }

  set errorMessage(message: string | null) {
    this._errorMessage = message;
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    // Only set timeout if the message is NOT an empty content validation (those are handled by cardErrorMessage)
    // AND if it's not null.
    if (message && !message.includes('cannot be empty')) {
      this.errorTimeout = setTimeout(() => {
        this._errorMessage = null;
      }, 10000); // 10 seconds
    }
  }

  get successMessage(): string | null {
    return this._successMessage;
  }

  set successMessage(message: string | null) {
    this._successMessage = message;
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    if (message) {
      this.successTimeout = setTimeout(() => {
        this._successMessage = null;
      }, 10000); // 10 seconds
    }
  }

  // New properties for new question card
  showPostQuestionCard: boolean = false;
  newQuestionTitle: string = '';
  newQuestionContent: string = '';

  // New properties for edit question card
  showEditQuestionCard: boolean = false;
  editingQuestion: Question | null = null; // Holds the question being edited

  // Existing properties for answer editing (remain unchanged functionality)
  answerContent: { [key: number]: string } = {};
  editingAnswerId: number | null = null;
  editingAnswerContent: string = '';

  currentUserId: number | null = null;
  currentUserRoles: string[] = [];

  constructor(
    private faqService: FaqService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    forkJoin({
      userId: this.authService.getCurrentUserAutoId(),
      userRoles: this.authService.getCurrentUserRoles()
    }).subscribe({
      next: ({ userId, userRoles }) => {
        this.currentUserId = userId;
        this.currentUserRoles = userRoles;
        this.loadQuestions();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load user data: ' + (err.error?.message || err.message);
        console.error('FaqComponent: Error loading user:', err);
      }
    });
  }

  loadQuestions(): void {
    this.faqService.getAllQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        this.successMessage = null;
        this.errorMessage = null; // Clear general messages on successful load
      },
      error: (err) => {
        this.errorMessage = 'Failed to load questions: ' + (err.error?.message || err.message);
        this.successMessage = null;
        console.error('FaqComponent: Error loading questions:', err);
      }
    });
  }

  // --- New Question Card Logic ---
  togglePostQuestionCard(): void {
    this.showPostQuestionCard = !this.showPostQuestionCard;
    if (this.showPostQuestionCard) {
      this.showEditQuestionCard = false; // Close edit card if opening post card
      this.editingQuestion = null;
    }
    // Always clear fields and messages when toggling
    this.newQuestionTitle = '';
    this.newQuestionContent = '';
    this.cardErrorMessage = null; // Clear card-specific error
    this.errorMessage = null; // Clear general messages
    this.successMessage = null;
  }

  postQuestion(): void {
    // Make question title mandatory
    if (!this.newQuestionTitle.trim()) {
      this.cardErrorMessage = 'Question title cannot be empty.';
      return;
    }
    if (!this.newQuestionContent.trim()) {
      this.cardErrorMessage = 'Question content cannot be empty.';
      return;
    }

    const questionRequest: QuestionRequest = {
      title: this.newQuestionTitle.trim(),
      content: this.newQuestionContent.trim()
    };

    this.faqService.postQuestion(questionRequest).subscribe({
      next: (newQuestion) => {
        this.questions.unshift(newQuestion);
        this.newQuestionTitle = '';
        this.newQuestionContent = '';
        this.successMessage = 'Question posted successfully!';
        this.cardErrorMessage = null; // Clear card-specific error on success
        this.errorMessage = null;
        this.showPostQuestionCard = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to post question: ' + (err.error?.message || err.message);
        this.successMessage = null;
        this.cardErrorMessage = null; // Clear card error if a server error occurs
        console.error('FaqComponent: Error posting question:', err);
      }
    });
  }

  // --- Question Edit Card Logic ---
  openEditQuestionCard(question: Question): void {
    this.showPostQuestionCard = false; // Close post card if opening edit card
    this.editingQuestion = { ...question };
    this.showEditQuestionCard = true;
    this.cardErrorMessage = null; // Clear card-specific error
    this.errorMessage = null; // Clear general messages
    this.successMessage = null;
  }

  saveEditedQuestion(): void {
    if (!this.editingQuestion || !this.editingQuestion.title.trim()) {
      this.cardErrorMessage = 'Edited question title cannot be empty.';
      return;
    }
    if (!this.editingQuestion || !this.editingQuestion.content.trim()) {
      this.cardErrorMessage = 'Edited question content cannot be empty.';
      return;
    }

    const questionRequest: QuestionRequest = {
      title: this.editingQuestion.title.trim(),
      content: this.editingQuestion.content.trim()
    };

    this.faqService.updateQuestion(this.editingQuestion.id, questionRequest).subscribe({
      next: (updatedQuestion) => {
        const index = this.questions.findIndex(q => q.id === updatedQuestion.id);
        if (index !== -1) {
          this.questions[index] = updatedQuestion;
        }
        this.successMessage = 'Question updated successfully!';
        this.errorMessage = null;
        this.cardErrorMessage = null; // Clear card-specific error on success
        this.showEditQuestionCard = false;
        this.editingQuestion = null;
      },
      error: (err) => {
        this.errorMessage = 'Failed to update question: ' + (err.error?.message || err.message);
        this.successMessage = null;
        this.cardErrorMessage = null; // Clear card error if a server error occurs
        console.error('FaqComponent: Error updating question:', err);
      }
    });
  }

  cancelEditQuestionCard(): void {
    this.showEditQuestionCard = false;
    this.editingQuestion = null;
    this.cardErrorMessage = null; // Clear card-specific error
    this.errorMessage = null; // Clear general messages
    this.successMessage = null;
  }

  // --- Delete Question ---
  deleteQuestion(questionId: number): void {
    this.faqService.deleteQuestion(questionId).subscribe({
      next: () => {
        this.questions = this.questions.filter(q => q.id !== questionId);
        this.successMessage = 'Question deleted successfully!';
        this.errorMessage = null;
        this.cardErrorMessage = null; // Clear card error as no card is active
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete question: ' + (err.error?.message || err.message);
        this.successMessage = null;
        this.cardErrorMessage = null;
        console.error('FaqComponent: Error deleting question:', err);
      }
    });
  }

  // --- Answer (Reply) Logic ---
  postAnswer(questionId: number): void {
    const content = this.answerContent[questionId];
    if (!content || !content.trim()) {
      // For answers, let's also use cardErrorMessage as it's typically tied to an input field
      this.cardErrorMessage = 'Answer content cannot be empty.';
      return;
    }

    const answerRequest: AnswerRequest = {
      content: content.trim()
    };

    this.faqService.postAnswer(questionId, answerRequest).subscribe({
      next: (newAnswer) => {
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
          question.answers.push(newAnswer);
          this.answerContent[questionId] = '';
          this.successMessage = 'Answer posted successfully!';
          this.errorMessage = null;
          this.cardErrorMessage = null; // Clear card-specific error on success
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to post answer: ' + (err.error?.message || err.message);
        this.successMessage = null;
        this.cardErrorMessage = null;
        console.error('FaqComponent: Error posting answer:', err);
      }
    });
  }

  editAnswer(answer: Answer): void {
    this.editingAnswerId = answer.id;
    this.editingAnswerContent = answer.content;
    this.cardErrorMessage = null; // Clear card-specific error
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveEditedAnswer(questionId: number): void {
    if (!this.editingAnswerId || !this.editingAnswerContent.trim()) {
      this.cardErrorMessage = 'Edited answer content cannot be empty.';
      return;
    }

    const answerRequest: AnswerRequest = {
      content: this.editingAnswerContent.trim()
    };

    this.faqService.updateAnswer(this.editingAnswerId, answerRequest).subscribe({
      next: (updatedAnswer) => {
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
          const index = question.answers.findIndex(a => a.id === updatedAnswer.id);
          if (index !== -1) {
            question.answers[index] = updatedAnswer;
          }
        }
        this.successMessage = 'Answer updated successfully!';
        this.errorMessage = null;
        this.cardErrorMessage = null; // Clear card-specific error on success
        this.editingAnswerId = null;
        this.editingAnswerContent = '';
      },
      error: (err) => {
        this.errorMessage = 'Failed to update answer: ' + (err.error?.message || err.message);
        this.successMessage = null;
        this.cardErrorMessage = null;
        console.error('FaqComponent: Error updating answer:', err);
      }
    });
  }

  cancelEditAnswer(): void {
    this.editingAnswerId = null;
    this.editingAnswerContent = '';
    this.cardErrorMessage = null; // Clear card-specific error
    this.errorMessage = null;
    this.successMessage = null;
  }

  // --- Delete Answer Method ---
  deleteAnswer(answerId: number): void {
    this.faqService.deleteAnswer(answerId).subscribe({
      next: () => {
        this.questions.forEach(q => {
          q.answers = q.answers.filter(a => a.id !== answerId);
        });
        this.successMessage = 'Answer deleted successfully!';
        this.errorMessage = null;
        this.cardErrorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete answer: ' + (err.error?.message || err.message);
        this.successMessage = null;
        this.cardErrorMessage = null;
        console.error('FaqComponent: Error deleting answer:', err);
      }
    });
  }

  isAnyAnswerEditing(question: Question): boolean {
    return question.answers.some(answer => this.editingAnswerId === answer.id);
  }

  // --- Helper Functions ---
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Invalid Date';
    }
  }

  isManager(): boolean {
    return this.currentUserRoles.includes('MANAGER');
  }

  isOwner(postUserId: number): boolean {
    return this.currentUserId !== null && this.currentUserId === postUserId;
  }
}