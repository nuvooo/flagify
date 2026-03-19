import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FlaskConical, Target } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { experimentsService } from '@/services/experiments.service';
import { flagsService } from '@/services/flags.service';
import { environmentsService } from '@/services/environments.service';
import { 
  CreateExperimentRequest, 
  CreateVariantRequest, 
  CreateMetricRequest,
  METRIC_TYPE_LABELS 
} from '@/types/experiments';
import { FeatureFlag } from '@/types/featureFlag';
import { Environment } from '@/types/environment';

export default function ExperimentForm() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [flagId, setFlagId] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [trafficAllocation, setTrafficAllocation] = useState(100);
  const [variants, setVariants] = useState<CreateVariantRequest[]>([
    { name: 'Control', key: 'control', value: 'false', trafficPercent: 50, isControl: true },
    { name: 'Variant A', key: 'variant-a', value: 'true', trafficPercent: 50 },
  ]);
  const [metrics, setMetrics] = useState<CreateMetricRequest[]>([]);

  useEffect(() => {
    if (orgId && projectId) {
      loadData();
    }
  }, [orgId, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flagsData, envsData] = await Promise.all([
        flagsService.getFlagsByProject(projectId!),
        environmentsService.getEnvironments(orgId!, projectId!)
      ]);
      setFlags(flagsData.featureFlags || []);
      setEnvironments(envsData);
      
      if (envsData.length > 0) {
        setEnvironmentId(envsData[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setKey(generateKey(value));
  };

  const addVariant = () => {
    const letter = String.fromCharCode(65 + variants.length - 1); // B, C, D...
    setVariants([
      ...variants,
      { 
        name: `Variant ${letter}`, 
        key: `variant-${letter.toLowerCase()}`, 
        value: 'true', 
        trafficPercent: 0 
      }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      toast({
        title: 'Error',
        description: 'At least 2 variants are required',
        variant: 'destructive',
      });
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof CreateVariantRequest, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    
    // Ensure only one control
    if (field === 'isControl' && value === true) {
      updated.forEach((v, i) => {
        if (i !== index) v.isControl = false;
      });
    }
    
    setVariants(updated);
  };

  const addMetric = () => {
    setMetrics([...metrics, { 
      name: '', 
      type: 'CONVERSION', 
      eventName: '',
      isPrimary: metrics.length === 0 
    }]);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: keyof CreateMetricRequest, value: any) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [field]: value };
    
    // Ensure only one primary metric
    if (field === 'isPrimary' && value === true) {
      updated.forEach((m, i) => {
        if (i !== index) m.isPrimary = false;
      });
    }
    
    setMetrics(updated);
  };

  const calculateTrafficDistribution = () => {
    const nonControl = variants.filter(v => !v.isControl);
    const control = variants.find(v => v.isControl);
    if (!control) return;

    const remainingTraffic = 100 - control.trafficPercent;
    const perVariant = Math.floor(remainingTraffic / nonControl.length);
    
    const updated = variants.map(v => {
      if (v.isControl) return v;
      return { ...v, trafficPercent: perVariant };
    });
    
    setVariants(updated);
  };

  const validateForm = (): boolean => {
    if (!name || !key || !flagId || !environmentId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return false;
    }

    if (variants.some(v => !v.name || !v.key || v.trafficPercent === undefined)) {
      toast({
        title: 'Validation Error',
        description: 'All variants must have a name, key, and traffic percentage',
        variant: 'destructive',
      });
      return false;
    }

    const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercent, 0);
    if (totalTraffic !== 100) {
      toast({
        title: 'Validation Error',
        description: `Traffic percentages must sum to 100%, currently ${totalTraffic}%`,
        variant: 'destructive',
      });
      return false;
    }

    const controlCount = variants.filter(v => v.isControl).length;
    if (controlCount !== 1) {
      toast({
        title: 'Validation Error',
        description: 'Exactly one variant must be marked as control',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !projectId || !validateForm()) return;

    try {
      setSaving(true);
      const data: CreateExperimentRequest = {
        name,
        key,
        description: description || undefined,
        hypothesis: hypothesis || undefined,
        flagId,
        environmentId,
        trafficAllocation,
        variants: variants.map(v => ({
          ...v,
          isControl: v.isControl || false
        })),
        metrics: metrics.filter(m => m.name && m.eventName).map(m => ({
          ...m,
          isPrimary: m.isPrimary || false
        }))
      };

      await experimentsService.createExperiment(orgId, projectId, data);
      toast({ title: 'Success', description: 'Experiment created successfully' });
      navigate(`/organizations/${orgId}/projects/${projectId}/experiments`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create experiment',
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
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}/experiments`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New A/B Test</h1>
          <p className="text-muted-foreground">
            Create an experiment to measure feature impact
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Experiment Details
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
                  placeholder="e.g., New Pricing Page Test"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g., pricing-page-test"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this experiment..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hypothesis">Hypothesis</Label>
              <Textarea
                id="hypothesis"
                value={hypothesis}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHypothesis(e.target.value)}
                placeholder="e.g., We believe the new pricing page will increase conversions by 15%..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Targeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Feature Flag *</Label>
                <Select value={flagId} onValueChange={setFlagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flag" />
                  </SelectTrigger>
                  <SelectContent>
                    {flags.map((flag) => (
                      <SelectItem key={flag.id} value={flag.id}>
                        {flag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Environment *</Label>
                <Select value={environmentId} onValueChange={setEnvironmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env.id} value={env.id}>
                        {env.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Traffic Allocation: {trafficAllocation}%</Label>
              <Slider
                value={[trafficAllocation]}
                onValueChange={(value: number[]) => setTrafficAllocation(value[0])}
                max={100}
                step={5}
              />
              <p className="text-sm text-muted-foreground">
                Percentage of total traffic that will be included in this experiment
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define different versions to test. One variant must be the control.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={variant.isControl ? 'default' : 'outline'}>
                      {variant.isControl ? 'Control' : `Variant ${index}`}
                    </Badge>
                    {!variant.isControl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateVariant(index, 'isControl', true)}
                      >
                        Set as Control
                      </Button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      placeholder="Variant name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Key</Label>
                    <Input
                      value={variant.key}
                      onChange={(e) => updateVariant(index, 'key', e.target.value)}
                      placeholder="variant-key"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Traffic %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={variant.trafficPercent}
                      onChange={(e) => updateVariant(index, 'trafficPercent', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-xs">Flag Value</Label>
                  <Input
                    value={variant.value}
                    onChange={(e) => updateVariant(index, 'value', e.target.value)}
                    placeholder="e.g., true, false, or JSON value"
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
              <Button type="button" variant="secondary" onClick={calculateTrafficDistribution}>
                Auto-Distribute Traffic
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Success Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define how you'll measure success. Mark one as primary.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={metric.isPrimary ? 'default' : 'outline'}>
                    {metric.isPrimary ? 'Primary Metric ★' : 'Secondary'}
                  </Badge>
                  <div className="flex gap-2">
                    {!metric.isPrimary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateMetric(index, 'isPrimary', true)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMetric(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={metric.name}
                      onChange={(e) => updateMetric(index, 'name', e.target.value)}
                      placeholder="e.g., Conversion Rate"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select 
                      value={metric.type} 
                      onValueChange={(v) => updateMetric(index, 'type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(METRIC_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-xs">Event Name (in your code)</Label>
                  <Input
                    value={metric.eventName}
                    onChange={(e) => updateMetric(index, 'eventName', e.target.value)}
                    placeholder="e.g., purchase, signup, page_view"
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addMetric}>
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}/experiments`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Experiment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
