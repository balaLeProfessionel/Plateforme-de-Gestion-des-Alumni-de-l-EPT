import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { EptPreset } from './theme/ept-preset';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptors';
import { RestaurationDefilement } from './core/navigation/restauration-defilement';

// Les pipes de date et de nombre s’affichent en français dans toute l’application.
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(RestaurationDefilement).demarrer()),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })),
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
