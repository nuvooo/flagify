import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Trash2, 
  Edit2,
  AlertTriangle,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { segmentsService } from '@/services/segments.service';
import { projectsService } from '@/services/projects.service';
import { Segment } from '@/types/segments';
import { Project } from '@/types/project';

export default function SegmentList() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [segments, setSegments] = useState<Segment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);

  useEffect(() => {
    if (orgId && projectId) {
      loadData();
    }
  }, [orgId, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [segmentsData, projectData] = await Promise.all([
        segmentsService.getSegments(orgId!, projectId!),
        projectsService.getProject(projectId!)
      ]);
      setSegments(segmentsData);
      setProject(projectData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load segments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!segmentToDelete || !orgId || !projectId) return;

    try {
      await segmentsService.deleteSegment(orgId, projectId, segmentToDelete.id);
      toast({
        title: 'Success',
        description: 'Segment deleted successfully',
      });
      setSegments(segments.filter(s => s.id !== segmentToDelete.id));
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete segment',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (segment: Segment) => {
    setSegmentToDelete(segment);
    setDeleteDialogOpen(true);
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
            <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
            <p className="text-muted-foreground">
              Reusable user groups for targeting • {project?.name}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Segment
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">What are Segments?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Segments are reusable groups of users defined by conditions (e.g., users from Germany, 
                Premium plan customers, or users who signed up in the last 30 days). 
                Use them in targeting rules to quickly apply the same criteria across multiple feature flags.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments List */}
      {segments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No segments yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first segment to define reusable user groups for targeting.
            </p>
            <Button onClick={() => navigate('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <Card key={segment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{segment.name}</h3>
                      <Badge variant="secondary">{segment.key}</Badge>
                      {segment._count && segment._count.targetingRules > 0 && (
                        <Badge variant="outline" className="text-blue-600">
                          Used in {segment._count.targetingRules} rule(s)
                        </Badge>
                      )}
                    </div>
                    {segment.description && (
                      <p className="text-muted-foreground text-sm mb-3">
                        {segment.description}
                      </p>
                    )}
                    
                    {/* Conditions Preview */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {segment.conditions.map((condition, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {condition.attribute} {condition.operator} "{condition.value}"
                        </Badge>
                      ))}
                      {segment.conditions.length === 0 && (
                        <span className="text-sm text-muted-foreground italic">
                          No conditions defined
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`${segment.id}/edit`)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(segment)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Segment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{segmentToDelete?.name}"? 
              This action cannot be undone.
              {segmentToDelete && segmentToDelete._count && segmentToDelete._count.targetingRules > 0 && (
                <p className="mt-2 text-destructive font-medium">
                  Warning: This segment is used in {segmentToDelete._count.targetingRules} targeting rule(s).
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
