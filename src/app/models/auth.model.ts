export interface SignInRequest {

  email: string;
  password: string;
}
  

export interface SignInResponse {
  jwtToken: string;
  email: string;
  roles: string[];
  employeeId?: number;
  // Add other fields your backend login response includes them, e.g., firstName, lastName, userAutoId
}

export interface SignUpRequest {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactInformation: string;
  department: string;
  jobTitle: string;
  personalEmail: string;
}

export interface ResetPasswordRequest {
  organizationEmail: string;
  token: string; // This is the OTP
  newPassword: string;
}

// For generic success/error messages from backend (e.g., for forgot-password, reset-password)
export interface MessageResponse {
  message?: string; // Optional because error responses might use 'error'
  error?: string;   // Optional for success, required for error
  email?: string;   // Useful for register success to show email
  employeeId?: string; // Useful for register success to show employeeId
}

// --- NEW INTERFACE FOR FETCHED EMPLOYEE DETAILS ---
export interface EmployeeDetails {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string; // This is the organizational email from HR system
  // Add other fields here if your backend will provide them when fetching by ID
  // e.g., department, jobTitle, if they are also pre-filled.
  // For now, let's assume only firstName, lastName, email are fetched.
}


export interface AuthResponse {
  jwt: string;
  email: string;
  roles: string[];
  employeeId: number; // Ensure this is present if your backend AuthResponse includes it
}

// --- NEW: Interface for Employee Details DTO ---
export interface EmployeeDetails {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string; // This is the organizational email
  // Add other fields if your backend EmployeeDetailsDTO includes them
  // department?: string;
  // jobTitle?: string;
}
