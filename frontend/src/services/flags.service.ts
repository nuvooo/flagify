import api from '@/lib/api';

export const flagsService = {
  async getFlagsByProject(projectId: string): Promise<{ featureFlags: any[] }> {
    const response = await api.get(`/feature-flags/project/${projectId}`);
    return response.data;
  },
};
