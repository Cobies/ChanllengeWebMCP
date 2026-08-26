import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

export interface FormBinding {
  formId: string;
  formGroup: FormGroup;
  onSubmit?: (payload: unknown) => Promise<unknown> | unknown;
}

@Injectable({
  providedIn: 'root',
})
export class FormRegistry {
  private forms = new Map<string, FormBinding>();

  /**
   * Register an Angular FormGroup with an ID and optional submit callback.
   */
  registerForm(formId: string, formGroup: FormGroup, onSubmit?: (payload: unknown) => unknown): void {
    this.forms.set(formId, { formId, formGroup, onSubmit });
  }

  /**
   * Unregister a form.
   */
  unregisterForm(formId: string): boolean {
    return this.forms.delete(formId);
  }

  /**
   * Retrieve a registered form binding.
   */
  getForm(formId: string): FormBinding | undefined {
    return this.forms.get(formId);
  }

  /**
   * List all registered form IDs.
   */
  getRegisteredFormIds(): string[] {
    return Array.from(this.forms.keys());
  }

  /**
   * Extract validation errors for all invalid controls in the form.
   */
  getFormErrors(formGroup: FormGroup): Record<string, string> {
    const errors: Record<string, string> = {};
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control && control.errors) {
        const errorKey = Object.keys(control.errors)[0];
        errors[key] = `Validation failed: ${errorKey}`;
      }
    });
    return errors;
  }
}
