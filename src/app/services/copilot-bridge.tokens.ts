import { InjectionToken } from '@angular/core';

export const DEFAULT_COPILOT_API_BASE = 'https://bridge.cobiesscooby.com/v1';

export const COPILOT_API_BASE = new InjectionToken<string>('COPILOT_API_BASE', {
  providedIn: 'root',
  factory: () => DEFAULT_COPILOT_API_BASE,
});

export const BRIDGE_API_BASE = DEFAULT_COPILOT_API_BASE;
