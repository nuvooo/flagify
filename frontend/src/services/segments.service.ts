import api from '@/lib/api';
import { Segment, CreateSegmentRequest, UpdateSegmentRequest } from '@/types/segments';

const BASE_URL = (orgId: string, projectId: string) => 
  `/organizations/${orgId}/projects/${projectId}/segments`;

export const segmentsService = {
  async getSegments(organizationId: string, projectId: string): Promise<Segment[]> {
    const response = await api.get(BASE_URL(organizationId, projectId));
    return response.data;
  },

  async getSegment(organizationId: string, projectId: string, id: string): Promise<Segment> {
    const response = await api.get(`${BASE_URL(organizationId, projectId)}/${id}`);
    return response.data;
  },

  async createSegment(
    organizationId: string, 
    projectId: string, 
    data: CreateSegmentRequest
  ): Promise<Segment> {
    const response = await api.post(BASE_URL(organizationId, projectId), data);
    return response.data;
  },

  async updateSegment(
    organizationId: string,
    projectId: string,
    id: string,
    data: UpdateSegmentRequest
  ): Promise<Segment> {
    const response = await api.put(`${BASE_URL(organizationId, projectId)}/${id}`, data);
    return response.data;
  },

  async deleteSegment(organizationId: string, projectId: string, id: string): Promise<void> {
    await api.delete(`${BASE_URL(organizationId, projectId)}/${id}`);
  },
};
