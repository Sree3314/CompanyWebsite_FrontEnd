// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for things like *ngIf, *ngForq
import { RouterOutlet, RouterLink } from '@angular/router'; // Import RouterOutlet and RouterLink
@Component({
  selector: 'app-root',
  standalone: true, // <--- This indicates it's a standalone component
  imports: [
    CommonModule,
    RouterOutlet, // For the main router-outlet in app.component.html
    RouterLink    // For the navigation links in app.component.html   // Allows you to use routerLink="" in your HTML
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Company Homepage';
  image = "assets/company.png"; // Path to your logo image
}