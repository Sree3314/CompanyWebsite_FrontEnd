/**
 * Interface for the request payload when creating or updating a question.
 * Corresponds to QuestionRequest.java
 */
export interface QuestionRequest {
    title: string;
    content: string;
  }
  
  /**
   * Interface for the request payload when creating or updating an answer.
   * Corresponds to AnswerRequest.java
   */
  export interface AnswerRequest {
    content: string;
  }
  
  /**
   * Interface for the response data of an Answer.
   * Corresponds to AnswerResponse.java
   */
  export interface Answer {
    id: number;
    questionId: number;
    content: string;
    userExternalId: number;
    userName: string;
    userRole: string;
    userProfilePictureUrl: string; // Assuming this is a URL string
    postedAt: string; // ISO 8601 string
    lastUpdatedAt: string; // ISO 8601 string
  }
  
  /**
   * Interface for the response data of a Question.
   * Corresponds to QuestionResponse.java
   */
  export interface Question {
    id: number;
    title: string;
    content: string;
    userExternalId: number;
    userName: string;
    userRole: string;
    userProfilePictureUrl: string; // Assuming this is a URL string
    postedAt: string; // ISO 8601 string
    lastUpdatedAt: string; // ISO 8601 string
    answers: Answer[];
  }