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
  employeeId: string;
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
