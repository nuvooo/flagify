import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  TrendingUp,
  Calendar,
  Clock,

  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { experimentsService } from '@/services/experiments.service';
import { 
  Experiment, 
  ExperimentResults as ExperimentResultsType,
  EXPERIMENT_STATUS_LABELS,
  EXPERIMENT_STATUS_COLORS,
  METRIC_TYPE_LABELS 
} from '@/types/experiments';

export default function ExperimentResults() {
  const { orgId, projectId, experimentId } = useParams<{
    orgId: string;
    projectId: string;
    experimentId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [results, setResults] = useState<ExperimentResultsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId && projectId && experimentId) {
      loadData();
    }
  }, [orgId, projectId, experimentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expData, resultsData] = await Promise.all([
        experimentsService.getExperiment(orgId!, projectId!, experimentId!),
        experimentsService.getExperimentResults(orgId!, projectId!, experimentId!)
      ]);
      setExperiment(expData);
      setResults(resultsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load experiment results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercent = (num: number): string => {
    return (num * 100).toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!experiment || !results) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Experiment not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalExposures = results.variants.reduce((sum, v) => sum + v.exposures, 0);
  const primaryMetric = results.variants[0]?.metrics.find(m => m.isPrimary);

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}/experiments`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{experiment.name}</h1>
              <Badge className={EXPERIMENT_STATUS_COLORS[experiment.status]}>
                {EXPERIMENT_STATUS_LABELS[experiment.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Results and analytics • {experiment.environment?.name}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('edit')}>
          Edit Experiment
        </Button>
      </div>

      {/* Hypothesis */}
      {experiment.hypothesis && (
        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-1">Hypothesis</h3>
            <p className="text-muted-foreground italic">"{experiment.hypothesis}"</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Participants</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(totalExposures)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Variants</span>
            </div>
            <div className="text-2xl font-bold">{results.variants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Started</span>
            </div>
            <div className="text-lg font-medium">
              {experiment.startDate 
                ? new Date(experiment.startDate).toLocaleDateString()
                : 'Not started'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <div className="text-lg font-medium">
              {experiment.startDate && experiment.endDate
                ? `${Math.ceil((new Date(experiment.endDate).getTime() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                : experiment.startDate
                ? `${Math.ceil((Date.now() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Variant Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {results.variants.map((variant) => (
              <div key={variant.variantId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{variant.variantName}</h4>
                    {variant.isControl && (
                      <Badge variant="secondary">Control</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(variant.exposures)} participants
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {variant.trafficPercent}% traffic
                    </div>
                  </div>
                </div>

                <Progress 
                  value={totalExposures > 0 ? (variant.exposures / totalExposures) * 100 : 0} 
                  className="mb-4"
                />

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {variant.metrics.map((metric) => (
                    <div 
                      key={metric.metricId}
                      className={`p-3 rounded-lg ${metric.isPrimary ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}
                    >
                      <div className="text-sm text-muted-foreground mb-1">
                        {metric.metricName}
                        {metric.isPrimary && <span className="ml-1 text-primary">★</span>}
                      </div>
                      <div className="text-xl font-bold">
                        {metric.type === 'CONVERSION' || metric.type === 'UNIQUE_COUNT'
                          ? formatPercent(metric.rate / 100)
                          : metric.value.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {METRIC_TYPE_LABELS[metric.type]}
                        {metric.sampleSize > 0 && ` • ${formatNumber(metric.sampleSize)} events`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Primary Metric Comparison */}
      {primaryMetric && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Primary Metric: {primaryMetric.metricName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Variant</th>
                    <th className="text-right py-2 px-4">Participants</th>
                    <th className="text-right py-2 px-4">Conversions</th>
                    <th className="text-right py-2 px-4">Rate</th>
                    <th className="text-right py-2 px-4">Lift vs Control</th>
                  </tr>
                </thead>
                <tbody>
                  {results.variants.map((variant) => {
                    const metric = variant.metrics.find(m => m.isPrimary);
                    if (!metric) return null;
                    
                    const control = results.variants.find(v => v.isControl);
                    const controlMetric = control?.metrics.find(m => m.isPrimary);
                    const lift = controlMetric && controlMetric.rate > 0
                      ? ((metric.rate - controlMetric.rate) / controlMetric.rate) * 100
                      : 0;
                    
                    return (
                      <tr key={variant.variantId} className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {variant.variantName}
                            {variant.isControl && (
                              <Badge variant="outline" className="text-xs">Control</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{formatNumber(variant.exposures)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(metric.value)}</td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatPercent(metric.rate / 100)}
                        </td>
                        <td className={`text-right py-3 px-4 font-medium ${
                          lift > 0 ? 'text-green-600' : lift < 0 ? 'text-red-600' : ''
                        }`}>
                          {variant.isControl ? '-' : `${lift > 0 ? '+' : ''}${lift.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SDK Integration */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>SDK Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Use this code to assign users to variants and track events:
          </p>
          <pre className="bg-gray-950 text-gray-300 p-4 rounded-lg text-sm overflow-x-auto">
{`// Get variant for user
const variant = await togglely.getExperimentVariant(
  '${experiment.key}',
  userId
);

// Track conversion event
await togglely.trackExperimentEvent(
  '${experiment.key}',
  'purchase',
  { userId, value: 99.99 }
);`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
