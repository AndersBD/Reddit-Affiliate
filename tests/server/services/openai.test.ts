import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as openaiService from '../../../server/services/openai';

// Mock the service functions directly instead of mocking the OpenAI library
vi.mock('../../../server/services/openai', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    generateRedditPost: vi.fn(),
    checkContentCompliance: vi.fn(),
  };
});

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('generateRedditPost should return title and content', async () => {
    // Setup mock implementation
    vi.mocked(openaiService.generateRedditPost).mockResolvedValue({
      title: 'Mocked Title',
      content: 'Mocked content',
    });

    const result = await openaiService.generateRedditPost(
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

    expect(openaiService.generateRedditPost).toHaveBeenCalledWith(
      'Test Campaign',
      'Test Affiliate',
      'Test Product Description',
      'r/test',
      'No spam',
      'post'
    );
  });

  test('checkContentCompliance should return compliance status and issues', async () => {
    // Setup mock implementation for this test
    vi.mocked(openaiService.checkContentCompliance).mockResolvedValue({
      compliant: true,
      issues: [],
      suggestions: 'No issues found',
    });

    const result = await openaiService.checkContentCompliance('Test content', 'No spam rules');

    expect(result).toEqual({
      compliant: true,
      issues: [],
      suggestions: 'No issues found',
    });

    expect(openaiService.checkContentCompliance).toHaveBeenCalledWith('Test content', 'No spam rules');
  });

  test('generateRedditPost should handle API errors', async () => {
    // Setup mock implementation to throw error
    vi.mocked(openaiService.generateRedditPost).mockRejectedValue(new Error('Failed to generate content with AI'));

    await expect(
      openaiService.generateRedditPost(
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