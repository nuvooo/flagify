export interface Experiment {
  id: string;
  name: string;
  key: string;
  description?: string;
  hypothesis?: string;
  organizationId: string;
  projectId: string;
  flagId: string;
  environmentId: string;
  status: ExperimentStatus;
  trafficAllocation: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  flag: {
    id: string;
    name: string;
    key: string;
    flagType: string;
  };
  environment: {
    id: string;
    name: string;
    key: string;
  };
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  _count?: {
    events: number;
  };
}

export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  DRAFT: 'Draft',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const EXPERIMENT_STATUS_COLORS: Record<ExperimentStatus, string> = {
  DRAFT: 'bg-gray-500',
  RUNNING: 'bg-green-500',
  PAUSED: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  ARCHIVED: 'bg-slate-500',
};

export interface ExperimentVariant {
  id: string;
  experimentId: string;
  name: string;
  key: string;
  description?: string;
  value: string;
  trafficPercent: number;
  isControl: boolean;
  createdAt: string;
}

export interface ExperimentMetric {
  id: string;
  experimentId: string;
  name: string;
  type: MetricType;
  eventName: string;
  targetValue?: number;
  isPrimary: boolean;
  createdAt: string;
}

export type MetricType = 'CONVERSION' | 'COUNT' | 'SUM' | 'AVERAGE' | 'UNIQUE_COUNT';

export const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  CONVERSION: 'Conversion Rate',
  COUNT: 'Event Count',
  SUM: 'Sum of Values',
  AVERAGE: 'Average Value',
  UNIQUE_COUNT: 'Unique Users',
};

export interface CreateExperimentRequest {
  name: string;
  key: string;
  description?: string;
  hypothesis?: string;
  flagId: string;
  environmentId: string;
  trafficAllocation?: number;
  variants: CreateVariantRequest[];
  metrics?: CreateMetricRequest[];
}

export interface CreateVariantRequest {
  name: string;
  key: string;
  description?: string;
  value: string;
  trafficPercent: number;
  isControl?: boolean;
}

export interface CreateMetricRequest {
  name: string;
  type: MetricType;
  eventName: string;
  targetValue?: number;
  isPrimary?: boolean;
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  hypothesis?: string;
  status?: ExperimentStatus;
  trafficAllocation?: number;
  variants?: CreateVariantRequest[];
  metrics?: CreateMetricRequest[];
}

export interface ExperimentResults {
  experiment: {
    id: string;
    name: string;
    key: string;
    status: ExperimentStatus;
    startDate?: string;
    endDate?: string;
  };
  variants: VariantResult[];
}

export interface VariantResult {
  variantId: string;
  variantName: string;
  variantKey: string;
  isControl: boolean;
  exposures: number;
  trafficPercent: number;
  metrics: MetricResult[];
}

export interface MetricResult {
  metricId: string;
  metricName: string;
  type: MetricType;
  value: number;
  rate: number;
  sampleSize: number;
  exposures: number;
  isPrimary: boolean;
}
