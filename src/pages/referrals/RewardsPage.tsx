import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRewards, getAchievements, redeemReward, getChallenges } from '@/lib/referralApi';
import type { Reward, Achievement, Challenge } from '@/types/referral';
import { Trophy, Star, Gift, Zap, Target, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const ALL_ACHIEVEMENTS = [
  'FirstScan', '100Scans', 'FirstHumanization', 'FirstAPICall', 'FirstReferral', '10Referrals', 'TeamCreator', 'PowerUser', 'Educator', 'APIExpert', 'EarlyAdopter',
];

export default function RewardsPage() {
  const { profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, a, c] = await Promise.all([getRewards(), getAchievements(), getChallenges(true)]);
      setRewards(r);
      setAchievements(a);
      setChallenges(c);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const redeem = async (id: string) => {
    try {
      await redeemReward(id);
      await load();
      toast.success('Reward redeemed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to redeem');
    }
  };

  const unlockedSet = new Set(achievements.map((a) => a.achievement_type));

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rewards & Achievements</h1>
        <p className="text-muted-foreground">Earn points, unlock badges, and celebrate milestones.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Star className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Points</div><div className="text-xl font-semibold">{profile?.points_balance || 0}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Zap className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Credits</div><div className="text-xl font-semibold">{profile?.credits_balance || 0}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Trophy className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Achievements</div><div className="text-xl font-semibold">{achievements.length}/{ALL_ACHIEVEMENTS.length}</div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards"><Gift className="h-4 w-4 mr-1" /> Rewards</TabsTrigger>
          <TabsTrigger value="achievements"><Trophy className="h-4 w-4 mr-1" /> Achievements</TabsTrigger>
          <TabsTrigger value="challenges"><Target className="h-4 w-4 mr-1" /> Challenges</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.length === 0 && (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">No rewards yet. Start referring to earn.</CardContent></Card>
            )}
            {rewards.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base font-medium">{r.reward_type}</CardTitle>
                  <CardDescription>{r.amount ? `${r.amount} units` : 'Special reward'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-3">Earned {formatDistanceToNow(new Date(r.earned_at), { addSuffix: true })}</div>
                  <Button size="sm" onClick={() => redeem(r.id)} disabled={!!r.redeemed_at}>{r.redeemed_at ? 'Redeemed' : 'Redeem'}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="achievements">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ALL_ACHIEVEMENTS.map((type) => {
              const unlocked = unlockedSet.has(type as any);
              return (
                <Card key={type} className={unlocked ? '' : 'opacity-60'}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Trophy className={`h-5 w-5 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="text-sm font-medium">{type.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <Badge variant={unlocked ? 'default' : 'outline'}>{unlocked ? 'Unlocked' : 'Locked'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="challenges">
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base font-medium">{c.name}</CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Flame className="h-4 w-4" /> {formatDistanceToNow(new Date(c.end_date), { addSuffix: true })}</div>
                  <Badge variant="secondary">{c.challenge_type}</Badge>
                </CardContent>
              </Card>
            ))}
            {challenges.length === 0 && <p className="text-sm text-muted-foreground">No active challenges.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
