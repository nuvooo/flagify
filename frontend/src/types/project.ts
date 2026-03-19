export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  type: 'SINGLE' | 'MULTI';
  organizationId: string;
  organizationName?: string;
  createdAt: string;
  updatedAt?: string;
}
