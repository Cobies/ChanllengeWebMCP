import { InjectionToken, Injector, Provider } from '@angular/core';

export type SidebarViewCategory = 'workspace' | 'telemetry' | 'assistant';

export type SidebarDockMode = 'expanded' | 'rail' | 'collapsed' | 'drawer';

export interface SidebarViewConfig {
  id: string;
  title: string;
  icon: string;
  description?: string;
  category: SidebarViewCategory;
  order: number;
  route?: string;
  tools?: string[];
  badge?: string | (() => string | number | null);
  onSelect?: (injector: Injector) => void;
  enabled?: boolean;
}

/**
 * WorkspaceViewItem / SidebarModuleConfig aliases for Workspace View Navigation Hub.
 */
export type SidebarModuleConfig = SidebarViewConfig;
export type WorkspaceViewItem = SidebarViewConfig;

export const SIDEBAR_MODULE_CONFIGS = new InjectionToken<SidebarViewConfig[]>(
  'SIDEBAR_MODULE_CONFIGS'
);
export const SIDEBAR_VIEW_CONFIGS = SIDEBAR_MODULE_CONFIGS;

/**
 * Multi-provider helper to register sidebar workspace view configurations.
 */
export function provideSidebarModules(configs: SidebarViewConfig[]): Provider[] {
  return [
    {
      provide: SIDEBAR_MODULE_CONFIGS,
      useValue: configs,
      multi: true,
    },
  ];
}

export function provideSidebarViews(configs: SidebarViewConfig[]): Provider[] {
  return provideSidebarModules(configs);
}

