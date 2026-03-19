import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { segmentsService } from '@/services/segments.service';
import { CONDITION_OPERATORS, CreateConditionRequest } from '@/types/segments';

export default function SegmentForm() {
  const { orgId, projectId, segmentId } = useParams<{
    orgId: string;
    projectId: string;
    segmentId?: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!segmentId;

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<CreateConditionRequest[]>([
    { attribute: '', operator: 'EQUALS', value: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && orgId && projectId && segmentId) {
      loadSegment();
    }
  }, [isEditing, orgId, projectId, segmentId]);

  const loadSegment = async () => {
    try {
      setLoading(true);
      const segment = await segmentsService.getSegment(orgId!, projectId!, segmentId!);
      setName(segment.name);
      setKey(segment.key);
      setDescription(segment.description || '');
      setConditions(segment.conditions.length > 0 
        ? segment.conditions.map(c => ({
            attribute: c.attribute,
            operator: c.operator,
            value: c.value
          }))
        : [{ attribute: '', operator: 'EQUALS', value: '' }]
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load segment',
        variant: 'destructive',
      });
      navigate(`/organizations/${orgId}/projects/${projectId}/segments`);
    } finally {
      setLoading(false);
    }
  };

  const addCondition = () => {
    setConditions([...conditions, { attribute: '', operator: 'EQUALS', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof CreateConditionRequest, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing) {
      setKey(generateKey(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !projectId) return;

    // Validate
    if (!name || !key) {
      toast({
        title: 'Validation Error',
        description: 'Name and key are required',
        variant: 'destructive',
      });
      return;
    }

    const validConditions = conditions.filter(c => c.attribute && c.value);
    if (validConditions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one condition is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const data = {
        name,
        key,
        description: description || undefined,
        conditions: validConditions
      };

      if (isEditing) {
        await segmentsService.updateSegment(orgId, projectId, segmentId!, data);
        toast({ title: 'Success', description: 'Segment updated successfully' });
      } else {
        await segmentsService.createSegment(orgId, projectId, data);
        toast({ title: 'Success', description: 'Segment created successfully' });
      }

      navigate(`/organizations/${orgId}/projects/${projectId}/segments`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save segment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}/segments`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Segment' : 'New Segment'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? 'Update segment conditions' 
              : 'Create a reusable user group for targeting'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Segment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Premium Users"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g., premium-users"
                  disabled={isEditing}
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">Key cannot be changed</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe who belongs to this segment..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Users must match ALL conditions to be included in this segment (AND logic)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-start gap-2 p-4 border rounded-lg bg-muted/30">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Attribute</Label>
                    <Input
                      value={condition.attribute}
                      onChange={(e) => updateCondition(index, 'attribute', e.target.value)}
                      placeholder="e.g., user.plan"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Value</Label>
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="e.g., premium"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-5"
                  onClick={() => removeCondition(index)}
                  disabled={conditions.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addCondition}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Common Attributes</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><code>userId</code> - Unique user identifier</p>
              <p><code>plan</code> - Subscription plan (free, premium, enterprise)</p>
              <p><code>country</code> - User's country code (DE, US, etc.)</p>
              <p><code>role</code> - User role (admin, member, viewer)</p>
              <p><code>signupDate</code> - Account creation date</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}/segments`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Segment' : 'Create Segment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
