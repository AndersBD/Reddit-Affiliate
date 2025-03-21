import { describe, test, expect, vi, beforeEach } from 'vitest';
import { schedulePost, cancelScheduledPost, reschedulePost } from '../../../server/services/scheduler';
import { storage } from '../../../server/storage';

// Mock the external dependencies
vi.mock('../../../server/storage', () => ({
  storage: {
    getRedditPost: vi.fn(),
    updateRedditPost: vi.fn(),
    createActivity: vi.fn(),
  },
}));

vi.mock('../../../server/services/reddit', () => ({
  createRedditPost: vi.fn(),
}));

// Mock node-schedule
vi.mock('node-schedule', () => ({
  default: {
    scheduleJob: vi.fn(() => ({
      cancel: vi.fn(),
    })),
  },
}));

describe('Scheduler Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('schedulePost should return false if post does not exist', async () => {
    // Mock the storage to return null (post not found)
    vi.mocked(storage.getRedditPost).mockResolvedValue(undefined);

    const result = await schedulePost(999, new Date());
    
    expect(result).toBe(false);
    expect(storage.getRedditPost).toHaveBeenCalledWith(999);
  });

  test('schedulePost should schedule a post and update storage', async () => {
    // Mock the post data
    const mockPost = {
      id: 123,
      title: 'Test Post',
      content: 'Test content',
      subredditName: 'r/test',
      campaignId: 456,
    };

    // Mock successful post retrieval
    vi.mocked(storage.getRedditPost).mockResolvedValue(mockPost as any);
    vi.mocked(storage.updateRedditPost).mockResolvedValue(mockPost as any);
    vi.mocked(storage.createActivity).mockResolvedValue({ id: 789 } as any);

    const scheduledTime = new Date();
    const result = await schedulePost(123, scheduledTime);
    
    expect(result).toBe(true);
    expect(storage.getRedditPost).toHaveBeenCalledWith(123);
    expect(storage.updateRedditPost).toHaveBeenCalledWith(123, { scheduledTime });
    expect(storage.createActivity).toHaveBeenCalled();
  });

  test('cancelScheduledPost should return false if post does not exist', async () => {
    vi.mocked(storage.getRedditPost).mockResolvedValue(undefined);

    const result = await cancelScheduledPost(999);
    
    expect(result).toBe(false);
    expect(storage.getRedditPost).toHaveBeenCalledWith(999);
  });

  test('reschedulePost should call schedulePost with new time', async () => {
    // Mock implementation of schedulePost
    const mockSchedulePost = vi.fn().mockResolvedValue(true);
    vi.mock('../../../server/services/scheduler', async () => {
      const actual = await vi.importActual('../../../server/services/scheduler');
      return {
        ...actual,
        schedulePost: mockSchedulePost,
      };
    });

    const newScheduledTime = new Date();
    const result = await reschedulePost(123, newScheduledTime);
    
    expect(result).toBe(true);
    expect(mockSchedulePost).toHaveBeenCalledWith(123, newScheduledTime);
  });
});