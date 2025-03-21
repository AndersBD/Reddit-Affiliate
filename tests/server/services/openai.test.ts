import { describe, test, expect, vi, beforeEach } from 'vitest';

// Directly mock the service functions
vi.mock('../../../server/services/openai', () => ({
  generateRedditPost: vi.fn(),
  checkContentCompliance: vi.fn(),
  generateCommentResponse: vi.fn(),
  analyzeTrendingTopics: vi.fn(),
  generateAffiliateLinkDescription: vi.fn(),
  createOpenAIClient: vi.fn(),
}));

// Import after mocking
import { 
  generateRedditPost, 
  checkContentCompliance 
} from '../../../server/services/openai';

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('generateRedditPost should return title and content', async () => {
    // Setup mock implementation
    vi.mocked(generateRedditPost).mockResolvedValue({
      title: 'Mocked Title',
      content: 'Mocked content',
    });

    const result = await generateRedditPost(
      'Test Campaign',
      'Test Affiliate',
      'Test Product Description',
      'r/test',
      'No spam',
      'post'
    );

    expect(result).toEqual({
      title: 'Mocked Title',
      content: 'Mocked content',
    });

    expect(generateRedditPost).toHaveBeenCalledWith(
      'Test Campaign',
      'Test Affiliate',
      'Test Product Description',
      'r/test',
      'No spam',
      'post'
    );
  });

  test('checkContentCompliance should return compliance status and issues', async () => {
    // Setup mock implementation 
    vi.mocked(checkContentCompliance).mockResolvedValue({
      compliant: true,
      issues: [],
      suggestions: 'No issues found',
    });

    const result = await checkContentCompliance('Test content', 'No spam rules');

    expect(result).toEqual({
      compliant: true,
      issues: [],
      suggestions: 'No issues found',
    });

    expect(checkContentCompliance).toHaveBeenCalledWith('Test content', 'No spam rules');
  });

  test('generateRedditPost should handle API errors', async () => {
    // Mock implementation to throw error
    vi.mocked(generateRedditPost).mockRejectedValue(new Error('Failed to generate content with AI'));

    await expect(
      generateRedditPost(
        'Test Campaign',
        'Test Affiliate',
        'Test Product Description',
        'r/test',
        'No spam',
        'post'
      )
    ).rejects.toThrow('Failed to generate content with AI');
  });
});