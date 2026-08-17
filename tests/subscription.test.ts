import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  isPaidSubscriptionActive,
  isSubscriptionLoading,
} from '../src/lib/subscription.ts';

Deno.test('Active Pro subscription is treated as paid', () => {
  assertEquals(isPaidSubscriptionActive('pro', 'Active', null), true);
});

Deno.test('Active Business subscription is treated as paid', () => {
  assertEquals(isPaidSubscriptionActive('business', 'Active', null), true);
});

Deno.test('Free account is treated as not paid', () => {
  assertEquals(isPaidSubscriptionActive('free', 'Active', null), false);
  assertEquals(isPaidSubscriptionActive(null, null, null), false);
});

Deno.test('Canceled-but-active subscription is still entitled', () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  assertEquals(isPaidSubscriptionActive('pro', 'Cancelled', future), true);
  assertEquals(isPaidSubscriptionActive('pro', 'canceled', future), true);
});

Deno.test('Canceled-and-expired subscription is not entitled', () => {
  const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  assertEquals(isPaidSubscriptionActive('pro', 'Cancelled', past), false);
});

Deno.test('Past-due subscription is not entitled', () => {
  assertEquals(isPaidSubscriptionActive('pro', 'Past Due', null), false);
});

Deno.test('Loading state is identified while profile is still being fetched', () => {
  assertEquals(isSubscriptionLoading(undefined, undefined), true);
  assertEquals(isSubscriptionLoading(null, undefined), true);
  assertEquals(isSubscriptionLoading('free', 'Active'), false);
});
