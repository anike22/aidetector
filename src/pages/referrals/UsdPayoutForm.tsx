import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPayoutSetup, requestPayout, type PayoutSetup, type UsdBankDetails } from '@/lib/referralApi';
import { toast } from 'sonner';

const empty: UsdBankDetails = { account_holder: '', account_number: '', bank_name: '', bank_country: '', payout_country: '', swift_bic: '', bank_address: '', routing_number: '', currency: 'USD', method: 'Bank Transfer', usd_confirmed: false };
const fields = [
  ['account_holder', 'Account holder name', 'Name registered with your bank'],
  ['account_number', 'USD account number or IBAN', 'Account number or IBAN'],
  ['bank_name', 'Bank name', 'Receiving bank'],
  ['bank_address', 'Bank address', 'Receiving bank address'],
  ['bank_country', 'Bank country code', 'Two letters, e.g. US'],
  ['payout_country', 'Your payout country code', 'Two letters, e.g. IN'],
  ['swift_bic', 'SWIFT / BIC', '8 or 11 characters'],
  ['routing_number', 'Routing / ABA number (if required by your bank)', 'Optional'],
] as const;

export default function UsdPayoutForm({ setup, onRequested }: { setup: PayoutSetup; onRequested: () => Promise<void> }) {
  const [details, setDetails] = useState<UsdBankDetails>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      // Recheck eligibility immediately before submitting; the server checks again atomically.
      const current = await getPayoutSetup();
      if (!current.eligible) throw new Error(`You need at least $${current.minimum.toFixed(2)} in approved payable commissions.`);
      await requestPayout(details);
      setDetails({ ...empty });
      setMessage('Payout requested. Your submitted USD bank details are available only to authorized payout administrators.');
      toast.success('Payout requested');
      await onRequested();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Payout could not be submitted. Please try again.';
      setMessage(text); toast.error(text);
    } finally { setBusy(false); }
  };
  return <div className="space-y-4">
    <p>Approved payable balance: <strong>${setup.available.toFixed(2)}</strong>. Minimum payout: <strong>${setup.minimum.toFixed(2)}</strong>. Commissions have a {setup.hold_days}-day holding period.</p>
    <p className="text-sm text-muted-foreground">Payouts use bank transfer to a USD-denominated account, including for affiliates in India. Details are submitted with each request and reviewed before processing. No automatic transfer is initiated here.</p>
    {message && <p role="status" className="text-sm">{message}</p>}
    {!setup.eligible ? <p className="rounded-md border p-4 text-sm">Payment details can be submitted once your approved payable balance reaches ${setup.minimum.toFixed(2)}. Pending commissions and testing credits do not count toward this balance.</p> :
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
        <p className="font-medium">USD bank transfer details</p>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label, placeholder]) => <div key={key} className="space-y-1">
            <label htmlFor={`payout-${key}`} className="text-sm font-medium">{label}</label>
            <Input id={`payout-${key}`} name={key} value={details[key]} placeholder={placeholder}
              required={key !== 'routing_number'} maxLength={key.includes('country') ? 2 : key === 'swift_bic' ? 11 : key === 'routing_number' ? 50 : 300}
              minLength={key === 'routing_number' ? undefined : 2} spellCheck={false}
              pattern={key.includes('country') ? '[A-Za-z]{2}' : key === 'swift_bic' ? '[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?' : undefined}
              onChange={e => setDetails(previous => ({ ...previous, [key]: key.includes('country') || key === 'swift_bic' ? e.target.value.toUpperCase() : e.target.value }))} />
          </div>)}
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={details.usd_confirmed} onChange={e => setDetails(previous => ({ ...previous, usd_confirmed: e.target.checked }))} /><span>I confirm this account can receive USD bank transfers, the details are correct, and I authorize their use to process this payout.</span></label>
        <p className="text-xs text-muted-foreground">Submit bank details only through this signed-in form. Never include a banking password, PIN or one-time code.</p>
        <Button type="submit" disabled={busy || !details.usd_confirmed}>{busy ? 'Submitting…' : `Submit details & request $${setup.available.toFixed(2)} payout`}</Button>
      </form>}
  </div>;
}
