import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormRegistry,
  WebmcpThreeSceneBridge,
  WebMcpService,
  toWebMcpTool,
} from '@webmcp/angular';

@Component({
  selector: 'app-customizer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="glass-panel rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-4">
      <!-- Section Title -->
      <div class="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-cyan-600">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Configuration Studio
            </h2>
            <p class="text-xs text-slate-500">Reactive Form Bound to Agent Tools</p>
          </div>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-cyan-700 border border-slate-200/80">
          formId: vehicle_customizer
        </span>
      </div>

      <form [formGroup]="customizerForm" (ngSubmit)="submitOrder()" class="space-y-4">
        
        <!-- Exterior Chassis Color -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Primary Body Color</span>
            <span class="text-cyan-700 font-mono font-bold">{{ customizerForm.get('chassisColor')?.value }}</span>
          </label>
          <div class="flex items-center gap-2">
            @for (preset of colorPresets; track preset.hex) {
              <button
                type="button"
                (click)="setColor(preset.hex)"
                [style.background-color]="preset.hex"
                [title]="preset.name"
                class="w-7 h-7 rounded-full border-2 transition-transform transform hover:scale-110 flex items-center justify-center shadow-xs"
                [ngClass]="customizerForm.get('chassisColor')?.value === preset.hex ? 'border-slate-800 ring-2 ring-cyan-500/50 scale-105' : 'border-transparent opacity-80 hover:opacity-100'">
              </button>
            }
            <input
              type="color"
              formControlName="chassisColor"
              (input)="syncColorToScene()"
              class="w-8 h-7 rounded bg-transparent border-0 cursor-pointer p-0 ml-auto" />
          </div>
        </div>

        <!-- Drive Mode -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Powertrain Drive Mode
          </label>
          <div class="grid grid-cols-3 gap-2">
            @for (mode of driveModes; track mode.id) {
              <button
                type="button"
                (click)="setDriveMode(mode.id)"
                class="py-2 px-2 text-xs rounded-xl border font-medium transition-all text-center flex flex-col items-center gap-1 shadow-xs"
                [ngClass]="customizerForm.get('driveMode')?.value === mode.id 
                  ? 'bg-cyan-50 border-cyan-500/50 text-cyan-800 shadow-xs' 
                  : 'bg-white/60 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white'">
                <span class="font-bold">{{ mode.label }}</span>
                <span class="text-[9px] text-slate-500">{{ mode.desc }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Aerodynamics & Toggles -->
        <div class="grid grid-cols-2 gap-3 pt-1">
          <!-- Active Aero Spoiler -->
          <label class="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors shadow-xs">
            <div class="text-xs">
              <span class="font-semibold text-slate-800 block">Active Spoiler</span>
              <span class="text-[10px] text-slate-500">Carbon aero wing</span>
            </div>
            <input
              type="checkbox"
              formControlName="spoilerActive"
              class="w-4 h-4 rounded text-cyan-600 bg-white border-slate-300 focus:ring-cyan-500" />
          </label>

          <!-- Drone Escort -->
          <label class="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors shadow-xs">
            <div class="text-xs">
              <span class="font-semibold text-slate-800 block">AI Escort Drone</span>
              <span class="text-[10px] text-slate-500">Companion sensor</span>
            </div>
            <input
              type="checkbox"
              formControlName="droneAssist"
              class="w-4 h-4 rounded text-cyan-600 bg-white border-slate-300 focus:ring-cyan-500" />
          </label>
        </div>

        <!-- Customer / Order Identifier -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Build Owner / Pilot Name
          </label>
          <input
            type="text"
            formControlName="customerName"
            placeholder="e.g. Agent Samantha / Commander Vance"
            class="w-full px-3 py-2 rounded-xl bg-white/80 border border-slate-200 focus:border-cyan-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 shadow-xs transition-colors" />
        </div>

        <!-- Submit Build Action -->
        <div class="pt-2">
          <button
            type="submit"
            [disabled]="customizerForm.invalid"
            class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-xs text-white uppercase tracking-wider transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ lastOrderSubmitted() ? '✓ Build Order Transmitted' : 'Transmit Build Configuration' }}
          </button>
        </div>

      </form>
    </div>
  `,
})
export class CustomizerFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly formRegistry = inject(FormRegistry);
  private readonly sceneBridge = inject(WebmcpThreeSceneBridge);
  private readonly webmcp = inject(WebMcpService);

  customizerForm: FormGroup;
  lastOrderSubmitted = signal<boolean>(false);

  readonly colorPresets = [
    { name: 'Cyber Cyan', hex: '#00f0ff' },
    { name: 'Neon Purple', hex: '#a855f7' },
    { name: 'Laser Rose', hex: '#ff0055' },
    { name: 'Stealth Gold', hex: '#eab308' },
    { name: 'Acid Emerald', hex: '#10b981' },
  ];

  readonly driveModes = [
    { id: 'eco', label: 'Eco Cruiser', desc: 'Max range efficiency' },
    { id: 'sport', label: 'Sport GT', desc: 'Dynamic torque' },
    { id: 'overdrive', label: 'Overdrive', desc: 'Uncapped boost' },
  ];

  constructor() {
    this.customizerForm = this.fb.group({
      chassisColor: ['#00f0ff', Validators.required],
      driveMode: ['sport', Validators.required],
      spoilerActive: [true],
      droneAssist: [false],
      customerName: ['Judge Devpost', Validators.required],
    });
  }

  ngOnInit(): void {
    // Register Form in FormRegistry for form_action_runner tool
    this.formRegistry.registerForm('vehicle_customizer', this.customizerForm, async (payload) => {
      this.lastOrderSubmitted.set(true);
      return {
        orderId: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        timestamp: Date.now(),
        configuration: payload,
      };
    });

    // Listen to form value changes to update 3D scene in real-time
    this.customizerForm.get('chassisColor')?.valueChanges.subscribe((color) => {
      if (color) {
        this.sceneBridge.executeSceneAction({
          action: 'change_mesh_color',
          meshName: 'vehicle_chassis',
          hexColor: color,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.formRegistry.unregisterForm('vehicle_customizer');
  }

  setColor(hex: string): void {
    this.customizerForm.patchValue({ chassisColor: hex });
  }

  setDriveMode(mode: string): void {
    this.customizerForm.patchValue({ driveMode: mode });
  }

  syncColorToScene(): void {
    const color = this.customizerForm.get('chassisColor')?.value;
    if (color) {
      this.sceneBridge.executeSceneAction({
        action: 'change_mesh_color',
        meshName: 'vehicle_chassis',
        hexColor: color,
      });
    }
  }

  async submitOrder(): Promise<void> {
    if (this.customizerForm.valid) {
      await this.webmcp.executeTool(
        'form_action_runner',
        {
          formId: 'vehicle_customizer',
          fields: this.customizerForm.value,
          submit: true,
        },
        'ui'
      );
      this.lastOrderSubmitted.set(true);
    }
  }
}
