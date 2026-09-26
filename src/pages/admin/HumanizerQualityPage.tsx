import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, BarChart3, Database, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function HumanizerQualityPage() {
  const [loading, setLoading] = useState(false);

  // Mock data for the dashboard
  const metrics = {
    total_humanizations: 1250,
    success_rate: 94.5,
    failure_rate: 5.5,
    avg_processing_time: 12,
    avg_naturalness_improvement: 32,
    avg_meaning_preservation: 96,
    retry_rate: 8.2,
    truncation_rate: 0.1,
    empty_output_rate: 0.05,
    user_satisfaction: 4.6
  };

  const recentFailures = [
    { id: '1', date: '2026-06-01T10:30:00Z', error: 'Model timeout after 30s', model: 'gpt-4o' },
    { id: '2', date: '2026-06-01T09:15:00Z', error: 'Content policy violation', model: 'claude-3-opus' },
    { id: '3', date: '2026-05-31T18:45:00Z', error: 'Meaning preservation score too low (72%)', model: 'gpt-4o' }
  ];

  const handleRetry = (id: string) => {
    toast.success(`Retrying job ${id}...`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Humanizer Quality Center</h1>
          <p className="text-muted-foreground">Monitor performance, quality metrics, and manage model routing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Data refreshed')}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Processed</h3>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-bold">{metrics.total_humanizations}</span>
              <span className="text-sm text-green-500 font-medium flex items-center">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-bold">{metrics.success_rate}%</span>
            </div>
            <div className="mt-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${metrics.success_rate}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-muted-foreground">User Satisfaction</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-bold">{metrics.user_satisfaction}</span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Processing Time</h3>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-bold">{metrics.avg_processing_time}s</span>
              <span className="text-sm text-muted-foreground">-1.2s</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routing">
        <TabsList className="mb-4">
          <TabsTrigger value="routing">Model Routing</TabsTrigger>
          <TabsTrigger value="failures">Recent Failures</TabsTrigger>
          <TabsTrigger value="quality">Quality Thresholds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>Configure which AI models handle humanization requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg border-primary bg-primary/5">
                    <div className="flex justify-between items-center mb-2">
                      <Badge>Primary</Badge>
                      <span className="text-xs text-green-600 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Healthy</span>
                    </div>
                    <div className="text-lg font-bold mb-1">GPT-4o</div>
                    <div className="text-sm text-muted-foreground mb-4">Default model for all standard requests.</div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Latency: 800ms</span>
                      <span>Success: 98%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="secondary">Secondary</Badge>
                      <span className="text-xs text-green-600 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Healthy</span>
                    </div>
                    <div className="text-lg font-bold mb-1">Claude 3.5 Sonnet</div>
                    <div className="text-sm text-muted-foreground mb-4">Used for long documents and creative tones.</div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Latency: 1.2s</span>
                      <span>Success: 96%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline">Fallback</Badge>
                      <span className="text-xs text-yellow-600 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Standby</span>
                    </div>
                    <div className="text-lg font-bold mb-1">GPT-3.5-Turbo</div>
                    <div className="text-sm text-muted-foreground mb-4">Fallback if primary and secondary timeout.</div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Latency: 300ms</span>
                      <span>Success: 99%</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => toast.info('Opening configuration...')}>Edit Configuration</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Job Failures</CardTitle>
              <CardDescription>Review and replay failed humanization jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFailures.map(failure => (
                  <div key={failure.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-destructive/10 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-destructive">{failure.error}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Model: {failure.model} • {new Date(failure.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleRetry(failure.id)}>
                      Replay Job
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Guardrails</CardTitle>
              <CardDescription>Configure minimum acceptable scores for automated processing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <div className="font-medium">Minimum Meaning Preservation</div>
                    <div className="text-sm text-muted-foreground">Alternatives below this score will be discarded or retried.</div>
                  </div>
                  <div className="text-xl font-bold">85%</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <div className="font-medium">Auto-retry Limit</div>
                    <div className="text-sm text-muted-foreground">Maximum internal retries for quality failures.</div>
                  </div>
                  <div className="text-xl font-bold">3 attempts</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <div className="font-medium">Strict Mode Domains</div>
                    <div className="text-sm text-muted-foreground">Domains requiring 95%+ meaning preservation.</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Legal</Badge>
                    <Badge variant="secondary">Medical</Badge>
                    <Badge variant="secondary">Financial</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
