import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer, inject } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideWebMcp, provideWebMcpMemory } from '@webmcp/angular';
import { routes } from './app.routes';
import { provideSidebarModules } from './models/sidebar.models';
import { DEFAULT_SIDEBAR_MODULES } from './config/sidebar-modules.config';
import { AiNavigationService } from './services/ai-navigation.service';
import {
  provideEnterpriseBi,
  SupplyChainAdapter,
  FinancialRiskAdapter,
  CustomerRetentionAdapter,
  CloudFinOpsAdapter,
} from './core/bi';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideWebMcp({
      enableEmulatorFallback: true,
      enableBuiltInScreenshot: true,
      logExecutionToConsole: true,
    }),
    provideWebMcpMemory({
      dbName: 'webmcp_memory_db',
      enablePassiveToolCapture: true,
      enableNavigationCapture: true,
    }),
    provideSidebarModules(DEFAULT_SIDEBAR_MODULES),
    provideEnterpriseBi([
      new SupplyChainAdapter(),
      new FinancialRiskAdapter(),
      new CustomerRetentionAdapter(),
      new CloudFinOpsAdapter(),
    ]),
    provideEnvironmentInitializer(() => {
      inject(AiNavigationService);
    }),
  ],
};

