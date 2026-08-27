import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormRegistry } from './form-registry';
import { WebMcpService } from '../core/webmcp.service';
import { WebmcpFormRunnerService } from './form-runner.service';

describe('FormRegistry & WebmcpFormRunnerService', () => {
  let registry: FormRegistry;

  beforeEach(() => {
    registry = new FormRegistry();
  });

  it('should register and retrieve form bindings', () => {
    const testForm = new FormGroup({
      username: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
    });

    registry.registerForm('user_profile', testForm);
    expect(registry.getRegisteredFormIds()).toContain('user_profile');

    const binding = registry.getForm('user_profile');
    expect(binding).toBeDefined();
    expect(binding?.formGroup).toBe(testForm);
  });

  it('should detect validation errors in form controls', () => {
    const form = new FormGroup({
      requiredField: new FormControl('', Validators.required),
    });

    form.get('requiredField')?.markAsTouched();
    form.get('requiredField')?.updateValueAndValidity();

    const errors = registry.getFormErrors(form);
    expect(errors['requiredField']).toContain('Validation failed: required');
  });

  it('should execute form value updates via FormRunnerService', async () => {
    const service = new WebMcpService({ enableEmulatorFallback: true, logExecutionToConsole: false });
    const formGroup = new FormGroup({
      color: new FormControl('red'),
      spoiler: new FormControl(false),
    });

    registry.registerForm('vehicle_form', formGroup);

    // Patch form
    const formRunner = new WebmcpFormRunnerService(service, registry);

    const result = await formRunner.executeFormAction({
      formId: 'vehicle_form',
      fields: {
        color: 'cyber_cyan',
        spoiler: true,
      },
      submit: false,
    });

    expect(result.success).toBe(true);
    expect(formGroup.get('color')?.value).toBe('cyber_cyan');
    expect(formGroup.get('spoiler')?.value).toBe(true);
  });
});
