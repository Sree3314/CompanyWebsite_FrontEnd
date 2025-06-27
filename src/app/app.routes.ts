// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; // Make sure to import HomeComponent
import { FaqComponent } from './faq/faq.component';
import { JobPortalComponent } from './job-portal/job-portal.component';
import { ExhibitionComponent } from './exhibition/exhibition.component';
import { SignInSignUpComponent } from './sign-in-sign-up/sign-in-sign-up.component';
import { DashboardComponent } from './dashboard/dashboard.component'; 
import { AuthGuard } from './guards/auth.guard';
import {LeaderboardComponent} from './leaderboard/leaderboard.component'; // Import LeaderboardComponent
// Assuming you have a DashboardComponent
export const routes: Routes = [
  // This is the missing route that fixes the loop!
  { path: 'home', component: HomeComponent },

  { path: 'faq', component: FaqComponent },
  { path: 'job-portal', component: JobPortalComponent },
  { path: 'exhibition', component: ExhibitionComponent },
  {path:'signin_signup', component:SignInSignUpComponent},
  {path: 'leaderboard', component: LeaderboardComponent}, // Route for the leaderboard
{path: 'dashboard', component: DashboardComponent,canActivate:[AuthGuard]}, // Route for the dashboard

  // Redirect to the home path when the URL is empty
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  { path: 'exhibition/:id', loadComponent: () => import('./exhibition-details/exhibition-details.component').then(m => m.ExhibitionDetailsComponent) },

  // Redirect any unknown paths to the home path (this is now safe because /home is defined)
  { path: '**', redirectTo: '/home' }
 

];