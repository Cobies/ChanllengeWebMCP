import { WebMcpToolDefinition } from '../core/webmcp.types';
import {
  SubAgentToolFilter,
  SubAgentToolFilterGroup,
} from './subagent.types';

function isFilterGroup(filter: SubAgentToolFilter): filter is SubAgentToolFilterGroup {
  return typeof filter === 'object' && !(filter instanceof RegExp) && filter !== null;
}

function matchesPattern(name: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return name === pattern;
  }
  return pattern.test(name);
}

/**
 * Pure evaluation determining if a WebMCP tool matches the given filters.
 */
export function matchesToolFilter(
  tool: WebMcpToolDefinition,
  filters?: SubAgentToolFilter[]
): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }

  // 1. Check global denylist precedence across all group filters
  for (const filter of filters) {
    if (isFilterGroup(filter) && filter.deny && filter.deny.length > 0) {
      for (const denyPattern of filter.deny) {
        if (matchesPattern(tool.name, denyPattern)) {
          return false;
        }
      }
    }
  }

  // 2. Identify if any positive rules exist
  let hasPositiveRules = false;
  for (const filter of filters) {
    if (typeof filter === 'string' || filter instanceof RegExp || typeof filter === 'function') {
      hasPositiveRules = true;
      break;
    } else if (isFilterGroup(filter)) {
      if ((filter.allow && filter.allow.length > 0) || typeof filter.predicate === 'function') {
        hasPositiveRules = true;
        break;
      }
    }
  }

  // If only deny rules were supplied and none matched, tool is allowed
  if (!hasPositiveRules) {
    return true;
  }

  // 3. Evaluate positive matching rules (OR semantics across top-level filters)
  for (const filter of filters) {
    if (typeof filter === 'string') {
      if (tool.name === filter) {
        return true;
      }
    } else if (filter instanceof RegExp) {
      if (filter.test(tool.name)) {
        return true;
      }
    } else if (typeof filter === 'function') {
      if (filter(tool)) {
        return true;
      }
    } else if (isFilterGroup(filter)) {
      let groupMatches = true;

      if (filter.allow && filter.allow.length > 0) {
        groupMatches = filter.allow.some((allowPattern) =>
          matchesPattern(tool.name, allowPattern)
        );
      }

      if (groupMatches && typeof filter.predicate === 'function') {
        groupMatches = filter.predicate(tool);
      }

      if (groupMatches && ((filter.allow && filter.allow.length > 0) || typeof filter.predicate === 'function')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter and scope WebMCP tools for a subagent based on allowlist, regex,
 * predicates, denylists, and local tool overrides.
 *
 * @param allTools Array of tools registered in WebMcpService.
 * @param filters Optional array of tool filtering rules.
 * @param localTools Optional array of subagent-local tools (override global tools with same name).
 * @returns Scoped array of tool definitions.
 */
export function filterToolsForSubAgent(
  allTools: WebMcpToolDefinition[],
  filters?: SubAgentToolFilter[],
  localTools?: WebMcpToolDefinition[]
): WebMcpToolDefinition[] {
  const toolMap = new Map<string, WebMcpToolDefinition>();

  // 1. Filter global tools
  for (const tool of allTools) {
    if (matchesToolFilter(tool, filters)) {
      toolMap.set(tool.name, tool);
    }
  }

  // 2. Merge local tools (local tools override global tools with the same name)
  if (localTools && localTools.length > 0) {
    for (const localTool of localTools) {
      toolMap.set(localTool.name, localTool);
    }
  }

  return Array.from(toolMap.values());
}

/**
 * Helper factory to construct a structured SubAgentToolFilterGroup.
 */
export function createSubAgentToolFilter(group: SubAgentToolFilterGroup): SubAgentToolFilterGroup {
  return { ...group };
}


