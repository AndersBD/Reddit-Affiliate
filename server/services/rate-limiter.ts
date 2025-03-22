
import { RateLimiter } from 'limiter';

// 60 requests per minute as per Reddit's rules
const limiter = new RateLimiter({
  tokensPerInterval: 60,
  interval: "minute"
});

export async function checkRateLimit() {
  const hasToken = await limiter.tryRemoveTokens(1);
  if (!hasToken) {
    throw new Error('Rate limit exceeded');
  }
  return true;
}
