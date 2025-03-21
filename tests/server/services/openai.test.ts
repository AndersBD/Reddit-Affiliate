import { describe, test, expect, vi, beforeEach } from 'vitest';
import { generateRedditPost, checkContentCompliance } from '../../../server/services/openai';

// Mock OpenAI
vi.mock('openai', () => {
  const OpenAIMock = vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Mocked Title',
                  content: 'Mocked content',
                  compliant: true,
                  issues: [],
                  suggestions: '',
                }),
              },
            },
          ],
        }),
      },
    },
  }));

  return { OpenAI: OpenAIMock };
});

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('generateRedditPost should return title and content', async () => {
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
  });

  test('checkContentCompliance should return compliance status and issues', async () => {
    // Modify the mock implementation for this specific test
    const openaiModule = await import('openai');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              compliant: true,
              issues: [],
              suggestions: 'No issues found',
            }),
          },
        },
      ],
    });

    // @ts-ignore - Mocking the nested property
    openaiModule.OpenAI.prototype.chat.completions.create = mockCreate;

    const result = await checkContentCompliance('Test content', 'No spam rules');

    expect(result).toEqual({
      compliant: true,
      issues: [],
      suggestions: 'No issues found',
    });
  });

  test('generateRedditPost should handle API errors', async () => {
    // Mock the OpenAI create method to throw an error
    const openaiModule = await import('openai');
    const mockCreateError = vi.fn().mockRejectedValue(new Error('API Error'));

    // @ts-ignore - Mocking the nested property
    openaiModule.OpenAI.prototype.chat.completions.create = mockCreateError;

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