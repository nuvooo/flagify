import api from '@/lib/api';

export const environmentsService = {
  async getEnvironments(orgId: string, projectId: string): Promise<any[]> {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/environments`);
    return response.data;
  },
};
