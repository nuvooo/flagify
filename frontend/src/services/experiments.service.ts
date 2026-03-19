import api from '@/lib/api';
import { 
  Experiment, 
  CreateExperimentRequest, 
  UpdateExperimentRequest,
  ExperimentResults 
} from '@/types/experiments';

const BASE_URL = (orgId: string, projectId: string) => 
  `/organizations/${orgId}/projects/${projectId}/experiments`;

export const experimentsService = {
  async getExperiments(
    organizationId: string, 
    projectId: string,
    status?: string
  ): Promise<Experiment[]> {
    const params = status ? { status } : undefined;
    const response = await api.get(BASE_URL(organizationId, projectId), { params });
    return response.data;
  },

  async getExperiment(organizationId: string, projectId: string, id: string): Promise<Experiment> {
    const response = await api.get(`${BASE_URL(organizationId, projectId)}/${id}`);
    return response.data;
  },

  async getExperimentResults(
    organizationId: string, 
    projectId: string, 
    id: string
  ): Promise<ExperimentResults> {
    const response = await api.get(`${BASE_URL(organizationId, projectId)}/${id}/results`);
    return response.data;
  },

  async createExperiment(
    organizationId: string, 
    projectId: string, 
    data: CreateExperimentRequest
  ): Promise<Experiment> {
    const response = await api.post(BASE_URL(organizationId, projectId), data);
    return response.data;
  },

  async updateExperiment(
    organizationId: string,
    projectId: string,
    id: string,
    data: UpdateExperimentRequest
  ): Promise<Experiment> {
    const response = await api.put(`${BASE_URL(organizationId, projectId)}/${id}`, data);
    return response.data;
  },

  async startExperiment(organizationId: string, projectId: string, id: string): Promise<Experiment> {
    const response = await api.post(`${BASE_URL(organizationId, projectId)}/${id}/start`);
    return response.data;
  },

  async stopExperiment(organizationId: string, projectId: string, id: string): Promise<Experiment> {
    const response = await api.post(`${BASE_URL(organizationId, projectId)}/${id}/stop`);
    return response.data;
  },

  async deleteExperiment(organizationId: string, projectId: string, id: string): Promise<void> {
    await api.delete(`${BASE_URL(organizationId, projectId)}/${id}`);
  },
};
