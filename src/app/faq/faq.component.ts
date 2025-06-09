// src/app/faq/faq.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // If you use *ngIf, *ngFor etc.

@Component({
  selector: 'app-faq',
  standalone: true, // <--- Standalone
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FAQComponent { }