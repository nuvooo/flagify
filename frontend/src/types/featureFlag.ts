export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description?: string;
  flagType: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
  projectId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}
