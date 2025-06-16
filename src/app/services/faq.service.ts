// src/app/services/faq.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, Answer, QuestionRequest, AnswerRequest } from '../models/faq.model';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
  // Ensure this matches your backend's actual base URL for the FAQ module
  private apiUrl = 'http://localhost:8089/api/faq'; // <--- IMPORTANT CHANGE HERE


  constructor(private http: HttpClient) { }

  /**
   * Fetches all questions from the backend.
   * @returns An Observable emitting a list of Question objects.
   */
  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions`);
  }

  /**
   * Fetches a single question by its ID.
   * @param questionId The ID of the question to fetch.
   * @returns An Observable emitting a single Question object.
   */
  getQuestionById(questionId: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/questions/${questionId}`);
  }

  /**
   * Posts a new question to the backend.
   * @param questionRequest The question data.
   * @returns An Observable emitting the newly created Question object.
   */
  postQuestion(questionRequest: QuestionRequest): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/questions`, questionRequest);
  }

  /**
   * Updates an existing question.
   * @param questionId The ID of the question to update.
   * @param questionRequest The updated question data.
   * @returns An Observable emitting the updated Question object.
   */
  updateQuestion(questionId: number, questionRequest: QuestionRequest): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/questions/${questionId}`, questionRequest);
  }

  /**
   * Deletes a question.
   * @param questionId The ID of the question to delete.
   * @returns An Observable emitting nothing upon successful deletion.
   */
  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/questions/${questionId}`);
  }

  /**
   * Posts a new answer to a specific question.
   * @param questionId The ID of the question to answer.
   * @param answerRequest The answer data.
   * @returns An Observable emitting the newly created Answer object.
   */
  postAnswer(questionId: number, answerRequest: AnswerRequest): Observable<Answer> {
    return this.http.post<Answer>(`${this.apiUrl}/questions/${questionId}/answers`, answerRequest);
  }

  /**
   * Updates an existing answer.
   * @param answerId The ID of the answer to update.
   * @param answerRequest The updated answer data.
   * @returns An Observable emitting the updated Answer object.
   */
  updateAnswer(answerId: number, answerRequest: AnswerRequest): Observable<Answer> {
    return this.http.put<Answer>(`${this.apiUrl}/answers/${answerId}`, answerRequest);
  }

  /**
   * Deletes an answer.
   * @param answerId The ID of the answer to delete.
   * @returns An Observable emitting nothing upon successful deletion.
   */
  deleteAnswer(answerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/answers/${answerId}`);
  }
}