import api from '@/lib/api';
import { Project } from '@/types/project';

export const projectsService = {
  async getProject(projectId: string): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },
};
