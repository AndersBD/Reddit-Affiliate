import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as scheduler from '../../../server/services/scheduler';
import { storage } from '../../../server/storage';

// Mock the external dependencies
vi.mock('../../../server/storage', () => ({
  storage: {
    getRedditPost: vi.fn(),
    updateRedditPost: vi.fn(),
    createActivity: vi.fn(),
    getPendingScheduledPosts: vi.fn(),
  },
}));

vi.mock('../../../server/services/reddit', () => ({
  createRedditPost: vi.fn(),
  updatePostStats: vi.fn(),
}));

// Mock node-schedule
vi.mock('node-schedule', () => ({
  default: {
    scheduleJob: vi.fn().mockReturnValue({
      cancel: vi.fn(),
    }),
  },
}));

describe('Scheduler Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(scheduler, 'schedulePost');
    vi.spyOn(scheduler, 'cancelScheduledPost');
    vi.spyOn(scheduler, 'reschedulePost');
  });

  test('Scheduler module functions should be defined', () => {
    expect(scheduler.schedulePost).toBeDefined();
    expect(scheduler.cancelScheduledPost).toBeDefined();
    expect(scheduler.reschedulePost).toBeDefined();
    expect(scheduler.initializeScheduler).toBeDefined();
    expect(scheduler.getScheduledPosts).toBeDefined();
  });

  test('initializeScheduler should call storage.getPendingScheduledPosts', async () => {
    vi.mocked(storage.getPendingScheduledPosts).mockResolvedValue([]);
    await scheduler.initializeScheduler();
    expect(storage.getPendingScheduledPosts).toHaveBeenCalled();
  });

  test('getScheduledPosts should return an array', async () => {
    const posts = await scheduler.getScheduledPosts();
    expect(Array.isArray(posts)).toBe(true);
  });
});