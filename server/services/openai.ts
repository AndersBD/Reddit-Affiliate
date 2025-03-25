import OpenAI from "openai";
import { OPENAI_CONFIG } from "../config";

// Factory function for creating OpenAI client - makes testing easier
export function createOpenAIClient() {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  return new OpenAI({ 
    apiKey: OPENAI_CONFIG.apiKey || "demo-api-key" 
  });
}

// Use a singleton instance for normal operation
const openai = createOpenAIClient();

// Autonomous Content Agent interface to define structured data for the pipeline
export interface ContentResearchResult {
  keyword: string;
  subreddit: string;
  relatedPosts: Array<{
    title: string;
    url: string;
    upvotes: number;
    age: string;
    rank: number;
  }>;
  targetPost: {
    title: string;
    url: string;
    content: string;
    topComments: string[];
  };
  keywords: string[];
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
    mainConcerns: string[];
    mainBenefits: string[];
  };
  opportunityScore: number;
}

export interface CommentEngagementResult {
  originalPostUrl: string;
  commentText: string;
  affiliateLink?: string;
  promoCode?: string;
  expectedEngagement: {
    upvotePotential: number;
    clickPotential: number;
    conversionPotential: number;
  };
}

export interface OutrankingPostResult {
  title: string;
  content: string;
  targetSubreddit: string;
  affiliateLink?: string;
  promoCode?: string;
  tags: string[];
  expectedPerformance: {
    rankPotential: number;
    clickPotential: number;
    conversionPotential: number;
  };
  additionalNotes: string;
}

export interface KeywordLoopResult {
  processedKeywords: string[];
  recommendedNextKeywords: string[];
  performanceInsights: Record<string, {
    engagementRate: number;
    conversionRate: number;
    revenue: number;
  }>;
}

// Main autonomous content pipeline interface
export interface ContentPipeline {
  research: (keyword: string, productName: string) => Promise<ContentResearchResult>;
  comment: (research: ContentResearchResult, affiliateInfo: any) => Promise<CommentEngagementResult>;
  createPost: (research: ContentResearchResult, affiliateInfo: any) => Promise<OutrankingPostResult>;
  loopKeywords: (completedKeywords: string[], productCategory: string) => Promise<KeywordLoopResult>;
}

// Autonomous Content Pipeline Implementation
export class AutonomousContentAgent implements ContentPipeline {
  
  // Phase 1: Research & Discovery
  async research(keyword: string, productName: string): Promise<ContentResearchResult> {
    try {
      // Simulate search results gathering
      const searchQuery = `${keyword} ${productName} site:reddit.com`;
      console.log(`Researching: ${searchQuery}`);
      
      try {
        const response = await openai.chat.completions.create({
          model: OPENAI_CONFIG.model,
          messages: [
            {
              role: "system",
              content: `You are an expert at Reddit content research and SEO analysis.
              
Your task is to simulate the results of researching "${keyword}" related to "${productName}" on Reddit.

You need to create a detailed research report that includes:
1. Highly relevant subreddits where this topic is discussed
2. Simulated Reddit posts that would rank for this keyword
3. Example post content and comments
4. Keyword opportunities and sentiment analysis
5. An opportunity score (1-10) based on competition level and conversion potential

Respond with JSON in the exact format defined below (important!):
{
  "keyword": "exact keyword researched",
  "subreddit": "most relevant subreddit",
  "relatedPosts": [
    {
      "title": "example post title",
      "url": "reddit.com/r/subreddit/comments/example",
      "upvotes": number,
      "age": "3 months ago",
      "rank": 1
    },
    ...more posts
  ],
  "targetPost": {
    "title": "best matching post title",
    "url": "reddit.com/r/subreddit/comments/example",
    "content": "full post content example",
    "topComments": ["comment 1", "comment 2"]
  },
  "keywords": ["related keyword 1", "related keyword 2"],
  "sentimentAnalysis": {
    "positive": 0.6,
    "negative": 0.2,
    "neutral": 0.2,
    "mainConcerns": ["concern 1", "concern 2"],
    "mainBenefits": ["benefit 1", "benefit 2"]
  },
  "opportunityScore": 7
}

Make the results realistic but optimized for an affiliate marketing opportunity.`
            },
            {
              role: "user",
              content: `Research the keyword "${keyword}" for the product "${productName}". Identify Reddit posts, sentiment, and opportunity score.`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const responseContent = response.choices[0].message.content || '';
        return JSON.parse(responseContent);
      } catch (aiError) {
        console.warn("OpenAI API error, using fallback demo data:", aiError);
        // Return fallback demo data for development
        return {
          keyword: keyword,
          subreddit: "MechanicalKeyboards",
          relatedPosts: [
            {
              title: `My experience with the ${productName} after 6 months of heavy use`,
              url: "reddit.com/r/MechanicalKeyboards/comments/example1",
              upvotes: 542,
              age: "3 months ago",
              rank: 1
            },
            {
              title: `${productName} vs Razer Huntsman Elite - Which is better for gaming?`,
              url: "reddit.com/r/MechanicalKeyboards/comments/example2",
              upvotes: 329,
              age: "5 months ago",
              rank: 2
            },
            {
              title: `Just upgraded to a ${productName} and I'm blown away`,
              url: "reddit.com/r/MechanicalKeyboards/comments/example3",
              upvotes: 278,
              age: "2 months ago",
              rank: 3
            }
          ],
          targetPost: {
            title: `Is the ${productName} worth the premium price?`,
            url: "reddit.com/r/MechanicalKeyboards/comments/example4",
            content: `I've been looking at upgrading from my basic Logitech G213 to something more premium. The ${productName} caught my eye, but the price tag is making me hesitate. For those who own one, has it been worth the investment? I'm particularly interested in the key feel for both gaming and programming, and how durable it's been over time.`,
            topComments: [
              "Owned mine for about a year now. The build quality is exceptional and the Cherry MX switches are still as crisp as day one. For programming, it's been a game changer.",
              "I bought one last Black Friday and honestly, it's worth every penny. The macro keys are incredibly useful for productivity and the RGB is customizable without being too flashy.",
              "It's expensive but consider how many hours a day you use a keyboard. It's an investment that pays off in comfort and performance."
            ]
          },
          keywords: ["mechanical keyboard reviews", "premium gaming keyboards", "keyboards for programming", "RGB mechanical keyboards", "keyboard durability"],
          sentimentAnalysis: {
            positive: 0.7,
            negative: 0.1,
            neutral: 0.2,
            mainConcerns: ["high price", "software complexity", "loud key sound"],
            mainBenefits: ["build quality", "typing experience", "programmable features", "RGB customization"]
          },
          opportunityScore: 8
        };
      }
    } catch (error) {
      console.error("Research phase failed:", error);
      throw new Error("Failed to complete research phase");
    }
  }
  
  // Phase 2: Comment & Inject
  async comment(research: ContentResearchResult, affiliateInfo: any): Promise<CommentEngagementResult> {
    try {
      const { targetPost, subreddit, sentimentAnalysis } = research;
      const { affiliateLink, promoCode, productName, productDescription } = affiliateInfo;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert at creating authentic, non-promotional Reddit comments that naturally include affiliate information.

Your task is to create a comment for a Reddit post about ${productName} that will:
1. Sound like a genuine Reddit user sharing experience
2. Address key points/questions in the original post
3. Naturally mention your experience with the product
4. Include affiliate information in a non-promotional way
5. Use casual, conversational language typical of Reddit

Based on sentiment analysis, address these main concerns: ${sentimentAnalysis.mainConcerns.join(", ")}
Highlight these benefits naturally: ${sentimentAnalysis.mainBenefits.join(", ")}

Respond with JSON in this format:
{
  "originalPostUrl": "post URL",
  "commentText": "your natural-sounding comment with affiliate info embedded",
  "affiliateLink": "embedded link (if applicable)",
  "promoCode": "mentioned promo code (if applicable)",
  "expectedEngagement": {
    "upvotePotential": number from 1-10,
    "clickPotential": number from 1-10,
    "conversionPotential": number from 1-10
  }
}`
            },
            {
              role: "user",
              content: `Create a Reddit comment for this post:

Title: "${targetPost.title}"
Content: "${targetPost.content}"

Some top comments:
${targetPost.topComments.map(comment => `- "${comment}"`).join('\n')}

Subreddit: r/${subreddit}

Please include this affiliate link subtly: ${affiliateLink}
Promo code to mention naturally (if appropriate): ${promoCode}

The comment should feel helpful and authentic, not promotional.`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const responseContent = response.choices[0].message.content || '';
        return JSON.parse(responseContent);
      } catch (aiError) {
        console.warn("OpenAI API error, using fallback demo data:", aiError);
        // Return fallback demo data for development
        return {
          originalPostUrl: targetPost.url,
          commentText: `I've been using the ${productName} for about 8 months now and can definitely weigh in on this. I was also hesitant about the price initially, but it's honestly been worth every penny for me.\n\nThe build quality is exceptional - it feels premium and has zero flex. For both gaming and programming, the Cherry MX switches are perfect with just the right actuation force. The macro keys have been a game-changer for me in both coding and gaming.\n\nRegarding the concerns about software complexity, it does take a day or two to get used to iCUE, but once you've set up your profiles, you rarely need to mess with it. As for the price, I caught a sale with code ${promoCode} at ${affiliateLink} which made it more reasonable.\n\nHappy to answer any specific questions about it if you're still on the fence!`,
          affiliateLink: affiliateLink,
          promoCode: promoCode,
          expectedEngagement: {
            upvotePotential: 8,
            clickPotential: 7,
            conversionPotential: 6
          }
        };
      }
    } catch (error) {
      console.error("Comment phase failed:", error);
      throw new Error("Failed to generate engagement comment");
    }
  }
  
  // Phase 3: Outranking Post Creation
  async createPost(research: ContentResearchResult, affiliateInfo: any): Promise<OutrankingPostResult> {
    try {
      const { keyword, subreddit, relatedPosts, sentimentAnalysis } = research;
      const { affiliateLink, promoCode, productName, productDescription } = affiliateInfo;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert at creating high-ranking Reddit posts that naturally include affiliate information without being promotional.

Your task is to create a Reddit post about ${productName} that will:
1. Outrank existing posts for the keyword "${keyword}"
2. Provide genuine value and insight to r/${subreddit} members
3. Include personal experience with the product
4. Naturally include affiliate information without sounding promotional
5. Address common questions and concerns

Based on sentiment analysis, address these main concerns: ${sentimentAnalysis.mainConcerns.join(", ")}
Highlight these benefits naturally: ${sentimentAnalysis.mainBenefits.join(", ")}

The post should follow one of these high-performing formats:
- Personal review with unexpected insights
- Comparison with alternatives
- "What I wish I knew before buying"
- Unique use cases or tips

Respond with JSON in this format:
{
  "title": "engaging post title optimized for the keyword",
  "content": "full post content with affiliate info naturally embedded",
  "targetSubreddit": "subreddit name",
  "affiliateLink": "how the link is embedded",
  "promoCode": "how the promo code is mentioned (if applicable)",
  "tags": ["relevant", "post", "tags"],
  "expectedPerformance": {
    "rankPotential": number from 1-10,
    "clickPotential": number from 1-10, 
    "conversionPotential": number from 1-10
  },
  "additionalNotes": "any special considerations"
}`
            },
            {
              role: "user",
              content: `Create a Reddit post that can outrank these existing posts:

${relatedPosts.slice(0, 3).map(post => `- "${post.title}" (${post.upvotes} upvotes)`).join('\n')}

Target keyword: "${keyword}"
Target subreddit: r/${subreddit}
Product: ${productName}
Product description: ${productDescription}

Please include this affiliate link naturally: ${affiliateLink}
Promo code to mention (if appropriate): ${promoCode}

The post should feel authentic and provide real value, not like marketing.`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const responseContent = response.choices[0].message.content || '';
        return JSON.parse(responseContent);
      } catch (aiError) {
        console.warn("OpenAI API error, using fallback demo data:", aiError);
        // Return fallback demo data for development
        return {
          title: `What I Wish I Knew Before Buying the ${productName} - Honest Review After 6 Months`,
          content: `# What I Wish I Knew Before Buying the ${productName} - Honest Review After 6 Months\n\nAfter 6 months of using the ${productName} daily for both work and gaming, I wanted to share my experience to help others who might be on the fence about investing in a premium keyboard.\n\n## The Price Question\n\nLet's address the elephant in the room first - yes, this keyboard is expensive. When I was researching, the price made me hesitate for weeks. What finally convinced me was finding a decent discount with the promo code "${promoCode}" at ${affiliateLink} which brought it down to a more reasonable range.\n\n## Build Quality & Durability\n\nThis is where the ${productName} truly shines. After half a year of heavy use (I'm a programmer by day and gamer by night), it still feels brand new:\n\n- Zero key wobble\n- No sign of shine on the PBT keycaps\n- Sturdy aluminum frame with no flex\n- USB passthrough still works perfectly\n\n## Software Learning Curve\n\nThe iCUE software was initially overwhelming with all its options. My advice is to spend an hour setting up your profiles, and then you rarely need to touch it again. I created three profiles:\n\n1. **Coding** - with specific macros for my IDE\n2. **Gaming** - with game-specific lighting and macros\n3. **Writing** - with a gentle white backlight and no distractions\n\n## Gaming Performance\n\nI've tested this keyboard with fps games, MMOs, and strategy games. The Cherry MX Speed switches have a 1.2mm actuation point which has noticeably improved my reaction time in competitive play. The dedicated macro keys are perfect for MMOs.\n\n## Typing Experience\n\nAs someone who types 8+ hours a day, this is where I've seen the most benefit. My typing speed has increased by around 10 WPM, and I experience less finger fatigue during long coding sessions.\n\n## What I'd Change\n\nNo product is perfect, and there are a few things to be aware of:\n\n- The wrist rest could be more cushioned\n- The lighting effects can drain your PC resources if you go too crazy\n- It takes up significant desk space\n\n## Is It Worth It?\n\nIf you spend hours daily at your keyboard and appreciate quality tools, absolutely yes. The combination of build quality, typing experience, and customization options has made this a worthy investment for me.\n\nHappy to answer any specific questions in the comments!\n\n*Edit: If you're interested, I found the best deal at ${affiliateLink} with code "${promoCode}" for 20% off. It's where I bought mine and their customer service was excellent.*`,
          targetSubreddit: subreddit,
          affiliateLink: "Naturally embedded at the beginning and end of the post, presented as a helpful resource for getting a discount",
          promoCode: "Mentioned twice - once in the initial discussion of price and once in the edit at the end",
          tags: ["review", "mechanical keyboard", "gaming peripherals", "product comparison", "tech review"],
          expectedPerformance: {
            rankPotential: 9,
            clickPotential: 8,
            conversionPotential: 7
          },
          additionalNotes: "This post positions the affiliate link as genuinely helpful information rather than promotion. It addresses the main concerns (price, software complexity) directly while emphasizing benefits. The 'What I Wish I Knew' format tends to perform well as it promises insider knowledge."
        };
      }
    } catch (error) {
      console.error("Post creation phase failed:", error);
      throw new Error("Failed to generate outranking post");
    }
  }
  
  // Phase 4: Keyword/Niche Looping
  async loopKeywords(completedKeywords: string[], productCategory: string): Promise<KeywordLoopResult> {
    try {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert at affiliate keyword research and content planning.

Your task is to analyze previously used keywords and suggest the next best keywords to target for a ${productCategory} product.

Respond with JSON in this format:
{
  "processedKeywords": ["keyword1", "keyword2"],
  "recommendedNextKeywords": ["new keyword 1", "new keyword 2", "new keyword 3", "new keyword 4", "new keyword 5"],
  "performanceInsights": {
    "keyword1": {
      "engagementRate": 7.2,
      "conversionRate": 3.1,
      "revenue": 105
    },
    "keyword2": {
      "engagementRate": 5.8,
      "conversionRate": 2.4,
      "revenue": 89
    }
  }
}`
            },
            {
              role: "user",
              content: `We've already created content for these keywords:
${completedKeywords.join(', ')}

Based on these completed keywords, suggest the next 5 best keywords to target for a ${productCategory} product. 

Also, provide simulated performance data for the previously used keywords to help guide our strategy.`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const responseContent = response.choices[0].message.content || '';
        return JSON.parse(responseContent);
      } catch (aiError) {
        console.warn("OpenAI API error, using fallback demo data:", aiError);
        // Return fallback demo data for development
        
        // Generate performance data for existing keywords
        const existingKeywordsData: Record<string, { engagementRate: number; conversionRate: number; revenue: number }> = {};
        completedKeywords.forEach(keyword => {
          existingKeywordsData[keyword] = {
            engagementRate: parseFloat((Math.random() * 5 + 3).toFixed(1)), // 3.0-8.0
            conversionRate: parseFloat((Math.random() * 3 + 1).toFixed(1)), // 1.0-4.0
            revenue: Math.floor(Math.random() * 150 + 50) // 50-200
          };
        });
        
        // Generate new recommendations based on product category
        let recommendedKeywords: string[] = [];
        if (productCategory.toLowerCase().includes('keyboard') || productCategory.toLowerCase().includes('gaming')) {
          recommendedKeywords = [
            `${productCategory} for professionals`,
            `best ${productCategory} under $200`,
            `${productCategory} vs competition`,
            `is ${productCategory} worth it`,
            `${productCategory} long term review`
          ];
        } else {
          recommendedKeywords = [
            `best ${productCategory} 2025`,
            `${productCategory} review reddit`,
            `${productCategory} alternatives`,
            `${productCategory} pros and cons`,
            `${productCategory} for beginners`
          ];
        }
        
        return {
          processedKeywords: completedKeywords,
          recommendedNextKeywords: recommendedKeywords,
          performanceInsights: existingKeywordsData
        };
      }
    } catch (error) {
      console.error("Keyword loop phase failed:", error);
      throw new Error("Failed to generate keyword recommendations");
    }
  }
}

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

  try {
    // Generate varied, authentic content
    const content = await openai.chat.completions.create({
      model: "gpt-4o", // Using the newest OpenAI model
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
  } catch (error) {
    console.warn("OpenAI API error, using fallback demo data:", error);
    
    // Return fallback demo data for development
    if (contentType === "post") {
      // Generate a demo post title based on product description
      const productName = productDescription.split(' ').slice(0, 3).join(' ');
      const title = `I've been using the ${productName} for 3 months now - Here's my honest review`;
      
      // Generate a demo post content
      const content = `# ${title}

After using the ${productDescription} daily for the past 3 months, I wanted to share my experience with the r/${subredditName} community.

## What I Love About It

* The build quality is exceptional - feels premium and durable
* Performance has exceeded my expectations, especially for the price point
* Customer support was surprisingly responsive when I had questions

## What Could Be Better

* The setup process was a bit more complex than I expected
* Documentation could be clearer in some areas
* Minor quality control issues (though the manufacturer resolved them quickly)

## Is It Worth It?

For anyone considering this product, I'd definitely recommend it if you value [specific benefit related to product]. It's made a noticeable difference in my daily workflow/experience.

I'm happy to answer any specific questions about the ${productName} if you're on the fence!${disclosureText}`;
      
      return { title, content };
    } else {
      // Generate a demo comment
      const content = `I've been using the ${productDescription} for a while now and can share some insights. 

The thing that surprised me most was how well it handles [relevant feature]. I was initially skeptical because of the price, but it's genuinely exceeded my expectations.

One tip I'd suggest is to [specific usage advice]. Made a big difference for me!${disclosureText}`;
      
      return { 
        title: "Comment on product experience", 
        content 
      };
    }
  }
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