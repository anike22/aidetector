import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRewards, createReward, getAchievements, awardAchievement } from '@/lib/referralApi';
import type { Reward, RewardType, AchievementType } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const REWARD_TYPES: RewardType[] = ['Points','Credits','Badge','Achievement','FreeScan','ExtraAIWords','PremiumTrial','FeatureUnlock','ExclusiveTemplate'];
const ACHIEVEMENT_TYPES: AchievementType[] = ['FirstScan','100Scans','FirstHumanization','FirstAPICall','FirstReferral','10Referrals','TeamCreator','PowerUser','Educator','APIExpert','EarlyAdopter'];

export default function AdminRewardsConfigPage() {
  const { profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<RewardType>('Points');
  const [amount, setAmount] = useState('');
  const [achievement, setAchievement] = useState<AchievementType>('FirstScan');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getRewards();
      setRewards(data.slice(0, 100));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile]);

  const grantReward = async () => {
    try {
      await createReward({ user_id: userId, reward_type: type, amount: Number(amount) || undefined });
      await load();
      toast.success('Reward granted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant reward');
    }
  };

  const grantAchievement = async () => {
    try {
      await awardAchievement(userId, achievement);
      toast.success('Achievement granted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant achievement');
    }
  };

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reward Configuration</h1>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Grant reward</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Select value={type} onValueChange={(v) => setType(v as RewardType)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{REWARD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          <Button onClick={grantReward}>Grant Reward</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Grant achievement</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Select value={achievement} onValueChange={(v) => setAchievement(v as AchievementType)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>{ACHIEVEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={grantAchievement}>Grant Achievement</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Recent rewards</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>User</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Earned</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.user_id.slice(0, 8)}</TableCell>
                  <TableCell>{r.reward_type}</TableCell>
                  <TableCell>{r.amount ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(r.earned_at), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
