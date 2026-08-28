import { WebMcpPropertySchema, WebMcpToolParameterSchema } from './webmcp.types';

/**
 * Validation result for tool parameters.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate input parameters against a WebMcpToolParameterSchema.
 */
export function validateParameters(
  schema: WebMcpToolParameterSchema,
  params: Record<string, unknown>
): ValidationResult {
  const errors: string[] = [];

  if (!params || typeof params !== 'object') {
    return { valid: false, errors: ['Parameters must be an object'] };
  }

  // Check required properties
  if (schema.required) {
    for (const requiredKey of schema.required) {
      if (!(requiredKey in params) || params[requiredKey] === undefined || params[requiredKey] === null) {
        errors.push(`Missing required parameter: '${requiredKey}'`);
      }
    }
  }

  // Check types and enum constraints
  for (const [key, val] of Object.entries(params)) {
    const propSchema = schema.properties[key];
    if (!propSchema) {
      if (schema.additionalProperties === false) {
        errors.push(`Unexpected parameter: '${key}'`);
      }
      continue;
    }

    if (val === undefined || val === null) {
      continue;
    }

    // Type check
    const actualType = Array.isArray(val) ? 'array' : typeof val;
    if (propSchema.oneOf || propSchema.anyOf) {
      const allowed = propSchema.oneOf || propSchema.anyOf;
      const matched = allowed?.some((subSchema) => {
        const subType = subSchema.type;
        if (!subType) return true;
        if (subType === 'integer') return typeof val === 'number' && Number.isInteger(val);
        return subType === actualType;
      });
      if (!matched) {
        errors.push(`Parameter '${key}' did not match any of the allowed schemas in oneOf/anyOf`);
      }
    } else if (propSchema.type) {
      if (Array.isArray(propSchema.type)) {
        if (!propSchema.type.includes(actualType as any)) {
          errors.push(`Parameter '${key}' must be one of [${propSchema.type.join(', ')}], received: '${actualType}'`);
        }
      } else if (propSchema.type === 'integer') {
        if (typeof val !== 'number' || !Number.isInteger(val)) {
          errors.push(`Parameter '${key}' must be an integer, received: ${typeof val}`);
        }
      } else if (propSchema.type !== actualType) {
        errors.push(`Parameter '${key}' must be of type '${propSchema.type}', received: '${actualType}'`);
      }
    }

    // Enum check
    if (propSchema.enum && !propSchema.enum.includes(val as string | number)) {
      errors.push(
        `Parameter '${key}' value '${val}' is not in allowed values: [${propSchema.enum.join(', ')}]`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Builder helper to create tool parameter schemas conveniently.
 */
export function createObjectSchema(
  properties: Record<string, WebMcpPropertySchema>,
  required?: string[]
): WebMcpToolParameterSchema {
  return {
    type: 'object',
    properties,
    required,
  };
}
