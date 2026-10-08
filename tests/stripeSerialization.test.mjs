import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const stripeCjs = path.dirname(require.resolve('stripe'));
const { stringifyRequestData } = require(path.join(stripeCjs, 'utils.js'));
const Stripe = require('stripe');

test('Stripe preserves nested metadata and payment method serialization', () => {
  const encoded = stringifyRequestData({
    amount: 100,
    currency: 'pln',
    payment_method_types: ['card', 'p24'],
    metadata: { username: 'synthetic user', user_id: 1, package_id: 2 },
  });
  const params = new URLSearchParams(encoded);
  assert.equal(params.get('amount'), '100');
  assert.equal(params.get('currency'), 'pln');
  assert.equal(params.get('payment_method_types[0]'), 'card');
  assert.equal(params.get('payment_method_types[1]'), 'p24');
  assert.equal(params.get('metadata[username]'), 'synthetic user');
  assert.equal(params.get('metadata[user_id]'), '1');
  assert.equal(params.get('metadata[package_id]'), '2');
});

test('Stripe serialization tolerates JSON metadata containing a non-callable isBuffer', () => {
  const input = JSON.parse('{"metadata":{"constructor":{"isBuffer":true},"username":"synthetic"}}');
  const params = new URLSearchParams(stringifyRequestData(input));
  assert.equal(params.get('metadata[constructor][isBuffer]'), 'true');
  assert.equal(params.get('metadata[username]'), 'synthetic');
});

test('Stripe webhook verification accepts valid signatures and rejects tampered input', () => {
  const stripe = new Stripe('sk_test_synthetic_local_only');
  const secret = 'synthetic-webhook-secret-local-only';
  const payload = JSON.stringify({ id: 'evt_synthetic', type: 'synthetic.event', data: { object: {} } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(stripe.webhooks.constructEvent(payload, header, secret).id, 'evt_synthetic');
  assert.throws(() => stripe.webhooks.constructEvent(payload + ' ', header, secret));
});
