import { TenantContext } from '../tenant/TenantContext';

export interface SecurityAuthorizationRequest {
  tenantContext: TenantContext;
  executionId: string;
  action: 'TOOL_INVOCATION' | 'RESOURCE_ACCESS' | 'AI_MODEL_INFERENCE' | 'MEMORY_QUERY';
  resourceTarget?: string;
  toolName?: string;
  requestedPrivacyMode?: 'STANDARD' | 'PRIVATE' | 'LOCAL_ONLY';
}

export interface SecurityAuthorizationResult {
  authorized: boolean;
  reason: string;
}

export class SecurityBoundary {
  private static instance: SecurityBoundary;

  private constructor() {}

  public static getInstance(): SecurityBoundary {
    if (!SecurityBoundary.instance) {
      SecurityBoundary.instance = new SecurityBoundary();
    }
    return SecurityBoundary.instance;
  }

  public authorize(req: SecurityAuthorizationRequest): SecurityAuthorizationResult {
    const { tenantContext, executionId, action, toolName, requestedPrivacyMode } = req;

    // Invariant 1 & 6 Check: Mandatory TenantContext and ExecutionId Traceability
    if (!tenantContext || !tenantContext.userId || !tenantContext.tenantId) {
      return {
        authorized: false,
        reason: '[SecurityBoundary DENIED] Missing or unauthenticated TenantContext.'
      };
    }

    if (!executionId) {
      return {
        authorized: false,
        reason: '[SecurityBoundary DENIED] Invariant 6 Violation: Execution traceability ID is missing.'
      };
    }

    // Invariant 4 Check: Hard LOCAL_ONLY Privacy Boundary
    if (tenantContext.privacyMode === 'LOCAL_ONLY' && requestedPrivacyMode === 'STANDARD') {
      return {
        authorized: false,
        reason: '[SecurityBoundary DENIED] Invariant 4 Violation: LOCAL_ONLY tenant context cannot invoke cloud AI models.'
      };
    }

    // Tool Authorization Matrix
    if (action === 'TOOL_INVOCATION' && toolName) {
      if (toolName === 'AdminSuperUserTool' && !tenantContext.roles.includes('admin')) {
        return {
          authorized: false,
          reason: `[SecurityBoundary DENIED] User ${tenantContext.userId} lacks role required for tool "${toolName}".`
        };
      }
    }

    return {
      authorized: true,
      reason: '[SecurityBoundary AUTHORIZED] Access granted under tenant context.'
    };
  }
}

export const securityBoundary = SecurityBoundary.getInstance();
