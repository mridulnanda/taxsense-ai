/**
 * Role-Based Access Control (RBAC)
 * 5 role levels with 50+ permissions and resource-level access control
 */

import { Role, Permission, RoleLevel, PermissionCategory, ResourcePermission } from '../types';

// ============================================================================
// Permission Definitions (50+ permissions)
// ============================================================================

export const PERMISSIONS_DATABASE: Permission[] = [
  // User Management (8 permissions)
  {
    id: 'perm-001',
    code: 'user:create',
    name: 'Create User',
    description: 'Create new users in the organization',
    category: PermissionCategory.UserManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-002',
    code: 'user:read',
    name: 'View User',
    description: 'View user profiles and information',
    category: PermissionCategory.UserManagement,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-003',
    code: 'user:update',
    name: 'Update User',
    description: 'Update user information',
    category: PermissionCategory.UserManagement,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-004',
    code: 'user:delete',
    name: 'Delete User',
    description: 'Delete user accounts',
    category: PermissionCategory.UserManagement,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-005',
    code: 'user:disable',
    name: 'Disable User',
    description: 'Disable user accounts',
    category: PermissionCategory.UserManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-006',
    code: 'user:resetPassword',
    name: 'Reset User Password',
    description: 'Reset user passwords',
    category: PermissionCategory.UserManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-007',
    code: 'user:bulkImport',
    name: 'Bulk Import Users',
    description: 'Import multiple users via CSV',
    category: PermissionCategory.UserManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-008',
    code: 'user:bulkExport',
    name: 'Bulk Export Users',
    description: 'Export user data in bulk',
    category: PermissionCategory.UserManagement,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Role Management (6 permissions)
  {
    id: 'perm-009',
    code: 'role:create',
    name: 'Create Role',
    description: 'Create new custom roles',
    category: PermissionCategory.RoleManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-010',
    code: 'role:read',
    name: 'View Role',
    description: 'View role definitions',
    category: PermissionCategory.RoleManagement,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-011',
    code: 'role:update',
    name: 'Update Role',
    description: 'Modify role permissions',
    category: PermissionCategory.RoleManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-012',
    code: 'role:delete',
    name: 'Delete Role',
    description: 'Delete custom roles',
    category: PermissionCategory.RoleManagement,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-013',
    code: 'role:assign',
    name: 'Assign Role',
    description: 'Assign roles to users',
    category: PermissionCategory.RoleManagement,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-014',
    code: 'role:revoke',
    name: 'Revoke Role',
    description: 'Remove roles from users',
    category: PermissionCategory.RoleManagement,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Audit Logging (6 permissions)
  {
    id: 'perm-015',
    code: 'audit:view',
    name: 'View Audit Logs',
    description: 'Access audit trail',
    category: PermissionCategory.AuditLog,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-016',
    code: 'audit:export',
    name: 'Export Audit Logs',
    description: 'Export audit logs for compliance',
    category: PermissionCategory.AuditLog,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-017',
    code: 'audit:delete',
    name: 'Delete Audit Logs',
    description: 'Delete old audit logs (retention)',
    category: PermissionCategory.AuditLog,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-018',
    code: 'audit:search',
    name: 'Search Audit Logs',
    description: 'Search audit logs',
    category: PermissionCategory.AuditLog,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-019',
    code: 'audit:verify',
    name: 'Verify Audit Trail',
    description: 'Cryptographically verify audit logs',
    category: PermissionCategory.AuditLog,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-020',
    code: 'audit:configure',
    name: 'Configure Audit Logging',
    description: 'Configure audit log settings',
    category: PermissionCategory.AuditLog,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Data Export (6 permissions)
  {
    id: 'perm-021',
    code: 'export:reports',
    name: 'Export Reports',
    description: 'Export tax reports',
    category: PermissionCategory.DataExport,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-022',
    code: 'export:financialData',
    name: 'Export Financial Data',
    description: 'Export financial information',
    category: PermissionCategory.DataExport,
    riskLevel: 'high',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-023',
    code: 'export:userData',
    name: 'Export User Data',
    description: 'Export personal user data (GDPR)',
    category: PermissionCategory.DataExport,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-024',
    code: 'export:pii',
    name: 'Export PII',
    description: 'Export personally identifiable information',
    category: PermissionCategory.DataExport,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-025',
    code: 'export:bulkData',
    name: 'Bulk Export',
    description: 'Export large datasets',
    category: PermissionCategory.DataExport,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-026',
    code: 'export:regulatoryReports',
    name: 'Export Regulatory Reports',
    description: 'Export reports for regulators',
    category: PermissionCategory.DataExport,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Report Generation (6 permissions)
  {
    id: 'perm-027',
    code: 'report:generate',
    name: 'Generate Reports',
    description: 'Generate tax reports',
    category: PermissionCategory.ReportGeneration,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-028',
    code: 'report:view',
    name: 'View Reports',
    description: 'View generated reports',
    category: PermissionCategory.ReportGeneration,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-029',
    code: 'report:modify',
    name: 'Modify Reports',
    description: 'Edit reports',
    category: PermissionCategory.ReportGeneration,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-030',
    code: 'report:delete',
    name: 'Delete Reports',
    description: 'Delete reports',
    category: PermissionCategory.ReportGeneration,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-031',
    code: 'report:schedule',
    name: 'Schedule Report Generation',
    description: 'Schedule automated report generation',
    category: PermissionCategory.ReportGeneration,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-032',
    code: 'report:share',
    name: 'Share Reports',
    description: 'Share reports with others',
    category: PermissionCategory.ReportGeneration,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Compliance Settings (6 permissions)
  {
    id: 'perm-033',
    code: 'compliance:view',
    name: 'View Compliance Status',
    description: 'View compliance information',
    category: PermissionCategory.ComplianceSettings,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-034',
    code: 'compliance:configure',
    name: 'Configure Compliance',
    description: 'Configure compliance settings',
    category: PermissionCategory.ComplianceSettings,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-035',
    code: 'compliance:generateReport',
    name: 'Generate Compliance Report',
    description: 'Generate compliance reports',
    category: PermissionCategory.ComplianceSettings,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-036',
    code: 'compliance:managePolicy',
    name: 'Manage Policies',
    description: 'Manage retention and data policies',
    category: PermissionCategory.ComplianceSettings,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-037',
    code: 'compliance:audit',
    name: 'Audit Compliance',
    description: 'Run compliance audits',
    category: PermissionCategory.ComplianceSettings,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-038',
    code: 'compliance:certify',
    name: 'Certify Compliance',
    description: 'Certify compliance status',
    category: PermissionCategory.ComplianceSettings,
    riskLevel: 'high',
    requiresMFA: true,
    createdAt: new Date(),
  },

  // Security Settings (8 permissions)
  {
    id: 'perm-039',
    code: 'security:configureAuth',
    name: 'Configure Authentication',
    description: 'Configure auth methods',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-040',
    code: 'security:configureMFA',
    name: 'Configure MFA',
    description: 'Configure multi-factor authentication',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-041',
    code: 'security:manageKeys',
    name: 'Manage Encryption Keys',
    description: 'Manage encryption keys',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-042',
    code: 'security:manageSecrets',
    name: 'Manage Secrets',
    description: 'Manage API keys and secrets',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-043',
    code: 'security:ipWhitelist',
    name: 'Manage IP Whitelist',
    description: 'Manage IP whitelisting',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-044',
    code: 'security:passwordPolicy',
    name: 'Manage Password Policy',
    description: 'Configure password requirements',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-045',
    code: 'security:viewEvents',
    name: 'View Security Events',
    description: 'View security events and alerts',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-046',
    code: 'security:respondIncidents',
    name: 'Respond to Security Incidents',
    description: 'Respond to security incidents',
    category: PermissionCategory.SecuritySettings,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Incident Management (4 permissions)
  {
    id: 'perm-047',
    code: 'incident:report',
    name: 'Report Incident',
    description: 'Report security incidents',
    category: PermissionCategory.IncidentManagement,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-048',
    code: 'incident:manage',
    name: 'Manage Incidents',
    description: 'Manage security incidents',
    category: PermissionCategory.IncidentManagement,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-049',
    code: 'incident:investigate',
    name: 'Investigate Incidents',
    description: 'Investigate security incidents',
    category: PermissionCategory.IncidentManagement,
    riskLevel: 'medium',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-050',
    code: 'incident:review',
    name: 'Review Incident Reports',
    description: 'Review incident reports',
    category: PermissionCategory.IncidentManagement,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // System Settings (2 permissions)
  {
    id: 'perm-051',
    code: 'system:configure',
    name: 'Configure System',
    description: 'Configure system settings',
    category: PermissionCategory.SystemSettings,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
  {
    id: 'perm-052',
    code: 'system:viewLogs',
    name: 'View System Logs',
    description: 'View system logs',
    category: PermissionCategory.SystemSettings,
    riskLevel: 'low',
    requiresMFA: false,
    createdAt: new Date(),
  },

  // Financial Data (2 permissions)
  {
    id: 'perm-053',
    code: 'financial:read',
    name: 'View Financial Data',
    description: 'View financial information',
    category: PermissionCategory.FinancialData,
    riskLevel: 'high',
    requiresMFA: false,
    createdAt: new Date(),
  },
  {
    id: 'perm-054',
    code: 'financial:write',
    name: 'Modify Financial Data',
    description: 'Edit financial information',
    category: PermissionCategory.FinancialData,
    riskLevel: 'critical',
    requiresMFA: true,
    createdAt: new Date(),
  },
];

// ============================================================================
// Default Role Definitions
// ============================================================================

export function getDefaultRoles(): Role[] {
  return [
    {
      id: 'role-super-admin',
      organizationId: 'system',
      name: 'Super Admin',
      level: RoleLevel.SuperAdmin,
      description: 'Full system access - all permissions',
      permissions: PERMISSIONS_DATABASE,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'role-admin',
      organizationId: 'system',
      name: 'Admin',
      level: RoleLevel.Admin,
      description: 'Administrative access',
      permissions: PERMISSIONS_DATABASE.filter(
        (p) =>
          !p.code.startsWith('system:') &&
          ![
            'role:delete',
            'user:delete',
            'audit:delete',
            'security:manageKeys',
            'security:manageSecrets',
            'financial:write',
          ].includes(p.code)
      ),
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'role-manager',
      organizationId: 'system',
      name: 'Manager',
      level: RoleLevel.Manager,
      description: 'Team management and reporting',
      permissions: PERMISSIONS_DATABASE.filter(
        (p) =>
          [
            'user:read',
            'user:update',
            'user:bulkExport',
            'role:read',
            'role:assign',
            'role:revoke',
            'audit:view',
            'audit:search',
            'audit:export',
            'export:reports',
            'export:regulatoryReports',
            'report:generate',
            'report:view',
            'report:schedule',
            'report:share',
            'compliance:view',
            'compliance:generateReport',
            'compliance:audit',
            'security:viewEvents',
            'incident:report',
            'incident:investigate',
            'financial:read',
          ].includes(p.code)
      ),
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'role-analyst',
      organizationId: 'system',
      name: 'Analyst',
      level: RoleLevel.Analyst,
      description: 'Report generation and analysis',
      permissions: PERMISSIONS_DATABASE.filter(
        (p) =>
          [
            'user:read',
            'audit:view',
            'audit:search',
            'export:reports',
            'report:generate',
            'report:view',
            'report:share',
            'compliance:view',
            'security:viewEvents',
            'financial:read',
          ].includes(p.code)
      ),
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'role-viewer',
      organizationId: 'system',
      name: 'Viewer',
      level: RoleLevel.Viewer,
      description: 'Read-only access',
      permissions: PERMISSIONS_DATABASE.filter(
        (p) =>
          [
            'user:read',
            'role:read',
            'audit:view',
            'audit:search',
            'report:view',
            'compliance:view',
            'security:viewEvents',
            'financial:read',
          ].includes(p.code)
      ),
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// ============================================================================
// RBAC Manager
// ============================================================================

export class RBACManager {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private resourcePermissions: Map<string, ResourcePermission[]> = new Map();

  constructor() {
    // Initialize default roles and permissions
    getDefaultRoles().forEach((role) => this.roles.set(role.id, role));
    PERMISSIONS_DATABASE.forEach((perm) => this.permissions.set(perm.code, perm));
  }

  // Role Management
  createRole(organizationId: string, name: string, permissionCodes: string[]): Role {
    const id = `role-${Date.now()}`;
    const permissions = permissionCodes
      .map((code) => this.permissions.get(code))
      .filter(Boolean) as Permission[];

    const role: Role = {
      id,
      organizationId,
      name,
      level: RoleLevel.Viewer, // Custom roles default to Viewer level
      permissions,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(id, role);
    return role;
  }

  updateRole(roleId: string, permissionCodes: string[]): Role | null {
    const role = this.roles.get(roleId);
    if (!role || role.isSystem) return null; // Can't modify system roles

    role.permissions = permissionCodes
      .map((code) => this.permissions.get(code))
      .filter(Boolean) as Permission[];
    role.updatedAt = new Date();

    this.roles.set(roleId, role);
    return role;
  }

  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null;
  }

  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role || role.isSystem) return false;

    return this.roles.delete(roleId);
  }

  listRoles(organizationId?: string): Role[] {
    if (!organizationId) {
      return Array.from(this.roles.values());
    }
    return Array.from(this.roles.values()).filter((r) => r.organizationId === organizationId);
  }

  // Permission Management
  getPermission(code: string): Permission | null {
    return this.permissions.get(code) || null;
  }

  listPermissions(category?: PermissionCategory): Permission[] {
    const perms = Array.from(this.permissions.values());
    if (!category) return perms;
    return perms.filter((p) => p.category === category);
  }

  // Access Control
  hasPermission(role: Role, permissionCode: string): boolean {
    return role.permissions.some((p) => p.code === permissionCode);
  }

  canPerformAction(role: Role, permissionCode: string, userHasMFA: boolean): boolean {
    const permission = this.permissions.get(permissionCode);
    if (!permission) return false;

    if (permission.requiresMFA && !userHasMFA) return false;

    return this.hasPermission(role, permissionCode);
  }

  // Resource-Level Access Control
  grantResourcePermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete' | 'share',
    grantedBy: string,
    expiresAt?: Date
  ): ResourcePermission {
    const id = `resp-${Date.now()}`;
    const permission: ResourcePermission = {
      id,
      userId,
      resourceType,
      resourceId,
      action,
      grantedAt: new Date(),
      grantedBy,
      expiresAt,
    };

    const key = `${userId}:${resourceType}:${resourceId}`;
    if (!this.resourcePermissions.has(key)) {
      this.resourcePermissions.set(key, []);
    }
    this.resourcePermissions.get(key)!.push(permission);

    return permission;
  }

  hasResourcePermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete' | 'share'
  ): boolean {
    const key = `${userId}:${resourceType}:${resourceId}`;
    const permissions = this.resourcePermissions.get(key) || [];

    return permissions.some(
      (p) => (p.action === action || p.action === 'write' || action === 'read') &&
             (!p.expiresAt || p.expiresAt > new Date())
    );
  }

  revokeResourcePermission(permissionId: string): boolean {
    for (const [, permissions] of this.resourcePermissions.entries()) {
      const index = permissions.findIndex((p) => p.id === permissionId);
      if (index !== -1) {
        permissions.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}
