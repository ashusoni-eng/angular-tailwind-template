import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || '';
  if (reason.includes('Failed to fetch dynamically imported module') || reason.includes('Loading chunk')) {
    console.warn('Detected missing chunk. Reloading the page...');
    location.reload();
  }
});