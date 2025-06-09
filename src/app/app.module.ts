import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module'; // Import your routing module

import { AppComponent } from './app.component';
import { FAQComponent } from './faq/faq.component';
import { JobPortalComponent } from './job-portal/job-portal.component';
import { ExhibitionComponent } from './exhibition/exhibition.component';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    FAQComponent,
    JobPortalComponent,
    ExhibitionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot(routes)  // Add AppRoutingModule to your imports array
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }