import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  FlaskConical, 
  Play, 
  Square, 
  Trash2, 
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { experimentsService } from '@/services/experiments.service';
import { projectsService } from '@/services/projects.service';
import { Experiment, EXPERIMENT_STATUS_LABELS, EXPERIMENT_STATUS_COLORS } from '@/types/experiments';
import { Project } from '@/types/project';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ExperimentList() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'start' | 'stop' | 'delete' | null;
    experiment: Experiment | null;
  }>({ open: false, type: null, experiment: null });

  useEffect(() => {
    if (orgId && projectId) {
      loadData();
    }
  }, [orgId, projectId, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [experimentsData, projectData] = await Promise.all([
        experimentsService.getExperiments(orgId!, projectId!, statusFilter || undefined),
        projectsService.getProject(projectId!)
      ]);
      setExperiments(experimentsData);
      setProject(projectData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load experiments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.experiment || !actionDialog.type || !orgId || !projectId) return;

    try {
      const exp = actionDialog.experiment;
      
      if (actionDialog.type === 'start') {
        await experimentsService.startExperiment(orgId, projectId, exp.id);
        toast({ title: 'Success', description: 'Experiment started' });
      } else if (actionDialog.type === 'stop') {
        await experimentsService.stopExperiment(orgId, projectId, exp.id);
        toast({ title: 'Success', description: 'Experiment stopped' });
      } else if (actionDialog.type === 'delete') {
        await experimentsService.deleteExperiment(orgId, projectId, exp.id);
        toast({ title: 'Success', description: 'Experiment deleted' });
      }
      
      loadData();
      setActionDialog({ open: false, type: null, experiment: null });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Action failed',
        variant: 'destructive',
      });
    }
  };

  const openActionDialog = (experiment: Experiment, type: 'start' | 'stop' | 'delete') => {
    setActionDialog({ open: true, type, experiment });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">A/B Tests</h1>
            <p className="text-muted-foreground">
              Run experiments and measure impact • {project?.name}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">What are A/B Tests?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A/B tests let you compare multiple variants of a feature to see which performs better. 
                Define variants, set traffic allocation, track metrics like conversion rates or revenue, 
                and make data-driven decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('DRAFT')}
        >
          Draft
        </Button>
        <Button
          variant={statusFilter === 'RUNNING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('RUNNING')}
        >
          Running
        </Button>
        <Button
          variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('COMPLETED')}
        >
          Completed
        </Button>
      </div>

      {/* Experiments List */}
      {experiments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No experiments yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first A/B test to start measuring feature impact.
            </p>
            <Button onClick={() => navigate('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Experiment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiments.map((exp) => (
            <Card key={exp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{exp.name}</h3>
                      <Badge className={EXPERIMENT_STATUS_COLORS[exp.status]}>
                        {EXPERIMENT_STATUS_LABELS[exp.status]}
                      </Badge>
                      {exp.metrics.some(m => m.isPrimary) && (
                        <Badge variant="outline">Primary Metric Set</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>Key: <code className="bg-muted px-1 rounded">{exp.key}</code></span>
                      <span>•</span>
                      <span>Flag: {exp.flag?.name}</span>
                      <span>•</span>
                      <span>Env: {exp.environment?.name}</span>
                      {exp.trafficAllocation !== 100 && (
                        <>
                          <span>•</span>
                          <span>{exp.trafficAllocation}% traffic</span>
                        </>
                      )}
                    </div>

                    {exp.hypothesis && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        "{exp.hypothesis}"
                      </p>
                    )}

                    {/* Variants Preview */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm text-muted-foreground">Variants:</span>
                      <div className="flex gap-2">
                        {exp.variants.map((variant) => (
                          <Badge 
                            key={variant.id}
                            variant={variant.isControl ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {variant.name} ({variant.trafficPercent}%)
                            {variant.isControl && ' 🎯'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Metrics Preview */}
                    {exp.metrics.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">Metrics:</span>
                        <div className="flex gap-2">
                          {exp.metrics.map((metric) => (
                            <Badge 
                              key={metric.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {metric.name}
                              {metric.isPrimary && ' ★'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {exp.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => openActionDialog(exp, 'start')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {exp.status === 'RUNNING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openActionDialog(exp, 'stop')}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`${exp.id}`)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    {exp.status !== 'RUNNING' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openActionDialog(exp, 'delete')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, experiment: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.type === 'delete' ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : actionDialog.type === 'start' ? (
                <Play className="h-5 w-5 text-green-500" />
              ) : (
                <Square className="h-5 w-5 text-yellow-500" />
              )}
              {actionDialog.type === 'start' && 'Start Experiment'}
              {actionDialog.type === 'stop' && 'Stop Experiment'}
              {actionDialog.type === 'delete' && 'Delete Experiment'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'start' && (
                <>Are you sure you want to start "{actionDialog.experiment?.name}"? 
                   Users will begin seeing different variants.</>
              )}
              {actionDialog.type === 'stop' && (
                <>Are you sure you want to stop "{actionDialog.experiment?.name}"? 
                   The experiment will be marked as completed and final results saved.</>
              )}
              {actionDialog.type === 'delete' && (
                <>Are you sure you want to delete "{actionDialog.experiment?.name}"? 
                   This action cannot be undone.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ open: false, type: null, experiment: null })}
            >
              Cancel
            </Button>
            <Button 
              variant={actionDialog.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleAction}
            >
              {actionDialog.type === 'start' && 'Start'}
              {actionDialog.type === 'stop' && 'Stop'}
              {actionDialog.type === 'delete' && 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
