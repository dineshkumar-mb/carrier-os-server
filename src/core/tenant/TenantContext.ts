export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly roles: readonly string[];
  readonly privacyMode: 'STANDARD' | 'PRIVATE' | 'LOCAL_ONLY';
}

export class TenantContextHolder {
  public static create(
    userId: string,
    tenantId?: string,
    roles: string[] = ['user'],
    privacyMode: TenantContext['privacyMode'] = 'STANDARD'
  ): TenantContext {
    if (!userId) {
      throw new Error('[TenantContext] Cannot initialize context without valid userId.');
    }
    const resolvedTenantId = tenantId || userId;

    return Object.freeze({
      tenantId: resolvedTenantId,
      userId,
      roles: Object.freeze([...roles]),
      privacyMode
    });
  }
}
