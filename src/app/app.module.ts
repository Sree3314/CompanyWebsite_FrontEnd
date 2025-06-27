// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; // For ngIf, ngFor etc.
import { FormsModule } from '@angular/forms'; // For ngModel

// Components that are NOT standalone must be declared here
import { AppComponent } from './app.component'; // AppComponent is standalone, but might be here for other reasons
import { FaqComponent } from './faq/faq.component'; // Import FAQComponent (now standalone)
import { JobPortalComponent } from './job-portal/job-portal.component';
import { ExhibitionComponent } from './exhibition/exhibition.component';
import { SignInSignUpComponent } from './sign-in-sign-up/sign-in-sign-up.component';
import { HomeComponent } from './home/home.component'; // Assuming HomeComponent is not standalone
import {LeaderboardComponent} from './leaderboard/leaderboard.component'; // Import LeaderboardComponent
// Components that ARE standalone must be imported here
import { DashboardComponent } from './dashboard/dashboard.component'; // Assuming the file is dashboard.component.ts

@NgModule({
  declarations: [
    // Remove FAQComponent from declarations since it's now standalone
    // AppComponent, // AppComponent is standalone and bootstrapped in main.ts
    // FAQComponent, // REMOVE THIS LINE
   
    // Declare HomeComponent if it's not standalone
  ],
  imports: [
    BrowserModule,
    CommonModule, // Required for common Angular directives like *ngIf, *ngFor
    FormsModule,  // Required for ngModel and form handling
    DashboardComponent, // Import DashboardComponent here because it's marked as `standalone: true`
    FaqComponent,
    JobPortalComponent,
    ExhibitionComponent,
    SignInSignUpComponent,
    LeaderboardComponent,
    HomeComponent // IMPORTANT: Import FAQComponent here because it's now standalone
    // Removed AppRoutingModule and RouterModule.forRoot(routes) as routing is now handled by app.config.ts
  ],
  providers: [
    // Removed provideHttpClient() here as it's handled by `app.config.ts`
    // Removed HTTP_INTERCEPTORS here as interceptors are provided via `withInterceptors` in `app.config.ts`
  ],
  // If AppComponent is truly standalone and bootstrapped directly,
  // then bootstrap: [AppComponent] might not be needed in AppModule,
  // but keeping it if there's a specific reason for this hybrid setup.
  bootstrap: [AppComponent]
})
export class AppModule { }
