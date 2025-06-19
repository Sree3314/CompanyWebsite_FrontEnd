// src/app/models/user.model.ts
export interface User {
    id: number | null;
    firstName: string;
    lastName: string;
    email: string;
    role: 'USER' | 'MANAGER'; // The key part for distinguishing roles
    employeeId: number | null; // Needed for some context, can be null
}