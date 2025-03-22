import OpenAI from "openai";

// Factory function for creating OpenAI client - makes testing easier
export function createOpenAIClient() {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  return new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY || "demo-api-key" 
  });
}

// Use a singleton instance for normal operation
const openai = createOpenAIClient();

// Generate Reddit post content based on campaign, template, and subreddit
export async function generateRedditPost(
  campaignName: string,
  affiliateName: string,
  productDescription: string,
  subredditName: string,
  subredditRules: string,
  contentType: "post" | "comment",
  productFocus?: string
): Promise<{ title: string; content: string }> {
  // Add disclosure template
  const disclosureText = "\n\n*Disclosure: This post contains affiliate links*";

  // Generate varied, authentic content
  const content = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a helpful Reddit user sharing genuine experiences. Create authentic, valuable content that follows Reddit's rules and community guidelines. Focus on providing real value while being transparent about affiliate relationships.`
      },
      {
        role: "user",
        content: `Write a ${contentType} for ${subredditName} about ${productDescription}. Follow these rules:
        - Must provide genuine value and insights
        - Natural, conversational tone
        - No direct promotion
        - Include personal experience
        - Follow subreddit rules: ${subredditRules}`
      }
    ]
  });

  const generatedContent = content.choices[0].message.content || "";

  return {
    title: generatedContent.split('\n')[0],
    content: generatedContent + disclosureText
  };
}

// Generate a response to a Reddit comment based on the original post and comment
export async function generateCommentResponse(
  originalPostTitle: string,
  originalPostContent: string,
  commentContent: string,
  campaignName: string,
  affiliateProgramName: string,
  productDescription: string,
  subredditName: string,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating authentic, conversational Reddit responses that naturally continue discussions about products without being promotional.

Your task is to respond to a comment on your Reddit post about ${productDescription} (${affiliateProgramName}).

Follow these important guidelines:
1. Be genuinely conversational and natural
2. Answer any questions asked in the comment
3. Share additional information if appropriate
4. Avoid obvious marketing or affiliate language
5. Sound like a real Reddit user, not a marketer
6. If the comment is negative or critical, respond respectfully and constructively
7. Keep your response to 80-150 words

Respond with JSON in this format: { "response": "Your response content..." }`,
        },
        {
          role: "user",
          content: `Here is my original post titled "${originalPostTitle}": 

"${originalPostContent}"

Someone left this comment: "${commentContent}"

Please write a natural, authentic-sounding response to this comment as part of my ${campaignName} campaign.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '';
    const result = JSON.parse(content);
    return result.response;
  } catch (error) {
    console.error("Error generating comment response:", error);
    throw new Error("Failed to generate response with AI");
  }
}

// Check content for compliance with Reddit rules and brand voice
export async function checkContentCompliance(
  content: string,
  subredditRules: string,
): Promise<{ compliant: boolean; issues: string[]; suggestions: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at evaluating Reddit content for compliance with platform rules, subreddit guidelines, and natural language patterns.

Your task is to analyze the provided content and determine if it complies with Reddit's general policies and the specific subreddit rules.

Analyze for these key factors:
1. Does it violate Reddit's content policies? (spam, manipulation, excessive self-promotion)
2. Does it violate the provided subreddit rules?
3. Does it sound like obvious marketing or affiliate content?
4. Is it authentic and conversational enough for Reddit?
5. Will it likely be flagged by moderators?

Respond with JSON in this format: 
{
  "compliant": true/false,
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": "Detailed suggestions to improve compliance"
}`,
        },
        {
          role: "user",
          content: `Please evaluate the following content for a Reddit post:

"${content}"

Subreddit rules: "${subredditRules}"

Is this content compliant with Reddit and subreddit rules? Would it pass as authentic content? Provide specific issues and actionable suggestions.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content || '';
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error checking content compliance:", error);
    throw new Error("Failed to check content compliance");
  }
}

// Analyze trending topics in a subreddit to tailor content
export async function analyzeTrendingTopics(
  subredditName: string,
  trendingPosts: Array<{ title: string; upvotes: number; comments: number }>,
): Promise<{ topics: string[]; recommendations: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing social media trends and creating content recommendations.

Your task is to analyze trending posts from a subreddit and identify patterns, topics, and approaches that are performing well.

Based on this analysis, you'll recommend content topics and approaches that would likely perform well in this community.

Respond with JSON in this format:
{
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "recommendations": "Detailed recommendations for content approach and strategy"
}`,
        },
        {
          role: "user",
          content: `Here are the current trending posts in ${subredditName}:

${trendingPosts.map(post => `- "${post.title}" (${post.upvotes} upvotes, ${post.comments} comments)`).join('\n')}

Analyze these posts and identify 5 trending topics or themes. Then provide strategic recommendations for creating content that would perform well in this subreddit.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content || '';
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error analyzing trending topics:", error);
    throw new Error("Failed to analyze trending topics");
  }
}

// Generate an optimized affiliate link description
export async function generateAffiliateLinkDescription(
  productName: string,
  productDescription: string,
  targetAudience: string,
  mainBenefit: string,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating subtle, effective call-to-action text for affiliate links.

Your task is to create a short, natural-sounding sentence or phrase that would make someone want to click on a link to learn more about a product.

The text should:
1. Not sound like obvious marketing
2. Create curiosity or highlight value
3. Feel like a natural recommendation
4. Be subtle and conversational
5. Be 10-15 words maximum

Respond with JSON in this format: { "linkText": "Your suggested link text" }`,
        },
        {
          role: "user",
          content: `Create a natural-sounding affiliate link text for ${productName}.

Product description: ${productDescription}
Target audience: ${targetAudience}
Main benefit to highlight: ${mainBenefit}

The link text should feel like a genuine recommendation, not marketing copy.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content || '';
    const result = JSON.parse(responseContent);
    return result.linkText;
  } catch (error) {
    console.error("Error generating affiliate link description:", error);
    throw new Error("Failed to generate affiliate link description");
  }
}