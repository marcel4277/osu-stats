// Keeps the backend within osu!'s API rule: no more than 60 requests a minute,
// with some bursting allowed. Going over it can get the API key revoked.
//
// A token bucket: it holds up to `burst` requests and refills at `perMinute`.
// When it's empty, requests wait their turn instead of failing. If the wait
// would be longer than `maxWaitMs`, the request is turned away straight away
// with a "busy" error, so a visitor isn't left staring at a spinner.
export function busyError() {
  const error = new Error('osu! request budget is used up');
  error.busy = true;
  return error;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function createRateLimiter({ perMinute, burst, maxWaitMs }) {
  const msPerToken = 60_000 / perMinute;
  let tokens = burst;
  let updatedAt = Date.now();
  let pausedUntil = 0;

  function refill() {
    const now = Date.now();
    // No refilling while osu! has told us to wait
    const from = Math.max(updatedAt, pausedUntil);
    if (now > from) tokens = Math.min(burst, tokens + (now - from) / msPerToken);
    updatedAt = now;
  }

  return {
    // Waits until a request may be sent. Tokens can go below zero: each waiting
    // request has reserved its own place in the line.
    async take() {
      refill();
      const pause = Math.max(0, pausedUntil - Date.now());
      const wait = pause + Math.max(0, (1 - tokens) * msPerToken);
      if (wait > maxWaitMs) throw busyError();
      tokens -= 1;
      if (wait > 0) await sleep(wait);
    },

    // osu! said "too many requests": stop sending for `ms` and start again
    // from an empty bucket.
    pause(ms) {
      refill();
      pausedUntil = Math.max(pausedUntil, Date.now() + ms);
      tokens = Math.min(tokens, 0);
    },
  };
}
