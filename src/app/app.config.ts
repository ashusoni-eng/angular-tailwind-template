import { ApplicationConfig } from '@angular/core';
import {provideRouter, withViewTransitions} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {apiInterceptor} from "./core/api.interceptor";
import { provideToastr } from 'ngx-toastr';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [      
      provideRouter(routes, withViewTransitions()),
      provideHttpClient(withInterceptors([apiInterceptor])),
      provideAnimations(),
      provideToastr({
          timeOut: 5000,
          positionClass: 'toast-top-center',
          preventDuplicates: true,
        }),
      provideAnimationsAsync(),
  ]
};
