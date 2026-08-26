import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideWebMcp } from '@webmcp/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideWebMcp({
      enableEmulatorFallback: true,
      enableBuiltInScreenshot: true,
      logExecutionToConsole: true,
    }),
  ],
};
