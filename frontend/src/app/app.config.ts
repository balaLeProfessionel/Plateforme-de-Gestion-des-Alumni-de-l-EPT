import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { EptPreset } from './theme/ept-preset';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
            theme: {
                preset: EptPreset,
                options: {
                  darkModeSelector: false
                }
            }
        })
  ]
};
