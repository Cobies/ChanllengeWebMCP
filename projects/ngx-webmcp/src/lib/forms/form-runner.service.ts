import { Injectable, inject } from '@angular/core';
import { WebMcpService } from '../core/webmcp.service';
import {
  FormActionRunnerParams,
  FormActionRunnerResult,
  WebMcpToolDefinition,
} from '../core/webmcp.types';
import { FormRegistry } from './form-registry';

@Injectable({
  providedIn: 'root',
})
export class WebmcpFormRunnerService {
  private readonly webmcp: WebMcpService;
  private readonly formRegistry: FormRegistry;

  constructor(webmcp?: WebMcpService, formRegistry?: FormRegistry) {
    this.webmcp = webmcp || inject(WebMcpService);
    this.formRegistry = formRegistry || inject(FormRegistry);
    this.registerFormTool();
  }

  private registerFormTool(): void {
    const formTool: WebMcpToolDefinition<FormActionRunnerParams, FormActionRunnerResult> = {
      name: 'form_action_runner',
      description:
        'Fills input fields, triggers validation checks, and submits registered Angular reactive forms.',
      parameters: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The unique identifier of the target reactive form',
          },
          fields: {
            type: 'object',
            description: 'Key-value map of form control names and their desired values',
          },
          submit: {
            type: 'boolean',
            description: 'Whether to trigger form submission after applying values (default: false)',
            default: false,
          },
        },
        required: ['formId', 'fields'],
      },
      handler: async (params: FormActionRunnerParams) => {
        return await this.executeFormAction(params);
      },
    };

    this.webmcp.registerTool(formTool);
  }

  /**
   * Execute form values patching and optional submission.
   */
  async executeFormAction(params: FormActionRunnerParams): Promise<FormActionRunnerResult> {
    const { formId, fields, submit } = params;
    const binding = this.formRegistry.getForm(formId);

    if (!binding) {
      const registered = this.formRegistry.getRegisteredFormIds().join(', ') || 'none';
      return {
        success: false,
        formId,
        submitted: false,
        message: `Form '${formId}' not found. Currently registered forms: [${registered}]`,
      };
    }

    const { formGroup, onSubmit } = binding;

    // Apply values to each control
    for (const [controlName, value] of Object.entries(fields)) {
      const control = formGroup.get(controlName);
      if (control) {
        control.setValue(value);
        control.markAsDirty();
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    }

    // Check validity
    if (formGroup.invalid) {
      const errors = this.formRegistry.getFormErrors(formGroup);
      return {
        success: false,
        formId,
        validationErrors: errors,
        submitted: false,
        message: `Form '${formId}' contains validation errors`,
      };
    }

    let resultPayload: unknown;
    let submitted = false;

    if (submit) {
      if (onSubmit) {
        resultPayload = await onSubmit(formGroup.value);
      }
      submitted = true;
    }

    return {
      success: true,
      formId,
      submitted,
      resultPayload: resultPayload || formGroup.value,
      message: submit
        ? `Form '${formId}' updated and submitted successfully`
        : `Form '${formId}' fields updated successfully`,
    };
  }
}
