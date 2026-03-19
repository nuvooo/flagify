export interface Segment {
  id: string;
  name: string;
  key: string;
  description?: string;
  organizationId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  conditions: SegmentCondition[];
  _count?: {
    targetingRules: number;
  };
}

export interface SegmentCondition {
  id: string;
  segmentId: string;
  attribute: string;
  operator: ConditionOperator;
  value: string;
  createdAt: string;
}

export type ConditionOperator = 
  | 'EQUALS' 
  | 'NOT_EQUALS' 
  | 'CONTAINS' 
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_IN'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'MATCHES_REGEX';

export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'NOT_CONTAINS', label: 'Does Not Contain' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'IN', label: 'In List' },
  { value: 'NOT_IN', label: 'Not In List' },
  { value: 'STARTS_WITH', label: 'Starts With' },
  { value: 'ENDS_WITH', label: 'Ends With' },
  { value: 'MATCHES_REGEX', label: 'Matches Regex' },
];

export interface CreateSegmentRequest {
  name: string;
  key: string;
  description?: string;
  conditions?: CreateConditionRequest[];
}

export interface CreateConditionRequest {
  attribute: string;
  operator: ConditionOperator;
  value: string;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  conditions?: CreateConditionRequest[];
}
