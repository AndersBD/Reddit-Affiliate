import { storage } from '../storage';
import { RedditOpportunity, InsertRedditOpportunity, AffiliateProgram, ContentTemplate } from '@shared/schema';
import { getSubredditsByCategory, getCategoriesForSubreddit } from './subreddit-categorizer';
import { AutonomousContentAgent } from './openai';

// Intent types based on pattern matching
export type ThreadIntent = 'DISCOVERY' | 'COMPARISON' | 'SHOWCASE' | 'QUESTION' | 'GENERAL';

// Additional metadata for enhanced opportunity analysis
export interface OpportunityAnalysis {
  keyPoints: string[];
  audience: {
    expectedDemographics: string[];
    interests: string[];
    pain: string;
    gain: string;
  };
  context: {
    userIntent: ThreadIntent;
    competitiveProducts: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    urgency: number; // 1-10
  };
  affiliateMatch: {
    score: number; // 0-100
    rationale: string;
    productFit: string[];
    objections: string[];
  };
  recommendations: {
    bestApproach: 'COMMENT' | 'POST' | 'BOTH';
    contentAngles: string[];
    keyMessaging: string[];
    callToActionStrength: number; // 1-10
  };
}

/**
 * Enhanced analysis of opportunity relevance and potential
 * @param opportunity The opportunity to analyze
 * @param affiliateProgram The affiliate program to match against
 */
export async function analyzeOpportunity(
  opportunity: RedditOpportunity,
  affiliateProgram: AffiliateProgram
): Promise<OpportunityAnalysis> {
  try {
    // Get subreddit categories
    const subreddit = await storage.getSubredditByName(opportunity.subreddit);
    
    if (!subreddit) {
      throw new Error(`Subreddit ${opportunity.subreddit} not found`);
    }
    
    // Get categories for the subreddit
    const subredditCategories = await getCategoriesForSubreddit(subreddit.id);
    
    // Determine if there's a category match between the subreddit and affiliate program
    const categoryMatch = subredditCategories.some(
      sc => sc.category.name === affiliateProgram.category
    );
    
    // Use AI to further analyze opportunity
    const contentAgent = new AutonomousContentAgent();
    
    // Create a lightweight research object focused on what we need
    const researchData = {
      keyword: opportunity.keyword,
      subreddit: opportunity.subreddit,
      targetPost: {
        title: opportunity.title,
        url: opportunity.url || opportunity.redditPostUrl,
        content: opportunity.snippet || '',
        topComments: []
      },
      keywords: [],
      opportunityScore: opportunity.opportunityScore || 0
    };
    
    // Extract thread intent from the opportunity data
    const intent = determineThreadIntent(opportunity.title, opportunity.snippet || '');
    
    // Calculate initial affinity score
    const initialScore = calculateAffinityScore(
      opportunity,
      affiliateProgram,
      categoryMatch,
      intent
    );
    
    // Generate a simplified analysis 
    // (In production this would use AI to generate a more detailed analysis)
    const analysis: OpportunityAnalysis = {
      keyPoints: [
        `Post in subreddit ${opportunity.subreddit}`,
        `Keyword focus: ${opportunity.keyword}`,
        `Thread appears to be a ${intent.toLowerCase()} thread`
      ],
      audience: {
        expectedDemographics: (subreddit?.audienceDemographics && 
            typeof subreddit.audienceDemographics === 'object' && 
            'demographics' in subreddit.audienceDemographics) 
          ? (subreddit.audienceDemographics as any).demographics : ['Unknown'],
        interests: subreddit?.primaryTopics || [],
        pain: determinePainPoint(opportunity.title, opportunity.snippet || ''),
        gain: determineGainDesire(opportunity.title, opportunity.snippet || '')
      },
      context: {
        userIntent: intent,
        competitiveProducts: extractCompetitiveProducts(opportunity.title, opportunity.snippet || ''),
        sentiment: analyzeSentiment(opportunity.title, opportunity.snippet || ''),
        urgency: calculateUrgency(opportunity.title, opportunity.snippet || '')
      },
      affiliateMatch: {
        score: initialScore,
        rationale: generateRationale(opportunity, affiliateProgram, categoryMatch, intent),
        productFit: determineFitFactors(opportunity, affiliateProgram),
        objections: anticipateObjections(opportunity, affiliateProgram)
      },
      recommendations: {
        bestApproach: determineBestApproach(intent, opportunity.opportunityScore || 0),
        contentAngles: suggestContentAngles(intent, opportunity, affiliateProgram),
        keyMessaging: suggestKeyMessages(intent, opportunity, affiliateProgram),
        callToActionStrength: determineCTAStrength(intent, opportunity.opportunityScore || 0)
      }
    };
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing opportunity:', error);
    
    // Return fallback analysis
    return createFallbackAnalysis(opportunity);
  }
}

/**
 * Analyze multiple opportunities to find the best ones for a campaign
 */
export async function rankOpportunitiesForCampaign(
  campaignId: number,
  limit: number = 10
): Promise<{opportunity: RedditOpportunity, analysis: OpportunityAnalysis, score: number}[]> {
  // Get campaign details
  const campaign = await storage.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign with ID ${campaignId} not found`);
  }
  
  // Get affiliate program
  const affiliateProgram = await storage.getAffiliateProgram(campaign.affiliateProgramId);
  if (!affiliateProgram) {
    throw new Error(`Affiliate program with ID ${campaign.affiliateProgramId} not found`);
  }
  
  // Get recent opportunities
  const opportunities = await storage.getRedditOpportunities(50);  // Get more than we need for filtering
  
  // Analyze each opportunity
  const analyzed = await Promise.all(
    opportunities.map(async opportunity => {
      const analysis = await analyzeOpportunity(opportunity, affiliateProgram);
      return {
        opportunity,
        analysis,
        score: analysis.affiliateMatch.score
      };
    })
  );
  
  // Sort by score (highest first) and take the top ones
  return analyzed
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find suitable content templates for an opportunity
 */
export async function findTemplatesForOpportunity(
  opportunity: RedditOpportunity,
  intent: ThreadIntent
): Promise<ContentTemplate[]> {
  // Get templates matching the detected intent and action type
  const contentType = opportunity.actionType || 'comment';
  const templates = await storage.getContentTemplatesByType(contentType);
  
  // Filter by intent match (search in tags)
  const matchingTemplates = templates.filter(template => {
    // Check if the template has tags that match our intent
    if (!template.tags) return false;
    
    const intentTag = intent.toLowerCase();
    return template.tags.some(tag => tag.toLowerCase().includes(intentTag));
  });
  
  return matchingTemplates;
}

// ======== Helper Functions ========

/**
 * Determine thread intent from title and snippet
 */
export function determineThreadIntent(title: string, snippet: string): ThreadIntent {
  const contentLower = (title + ' ' + snippet).toLowerCase();
  
  // Question pattern detection
  if (title.includes('?') || snippet.includes('?')) {
    // Discovery questions (looking for recommendations)
    if (contentLower.includes('what') && (
        contentLower.includes('recommend') || 
        contentLower.includes('best') || 
        contentLower.includes('top') ||
        contentLower.includes('suggestions')
      )) {
      return 'DISCOVERY';
    }
    
    // General questions
    return 'QUESTION';
  }
  
  // Comparison pattern detection
  if (contentLower.includes(' vs ') || 
      contentLower.includes('versus') || 
      contentLower.includes('compared to') ||
      contentLower.includes('better than') ||
      contentLower.includes('difference between')) {
    return 'COMPARISON';
  }
  
  // Showcase pattern detection
  if (contentLower.includes('how i ') || 
      contentLower.includes('i used ') || 
      contentLower.includes('check out ') ||
      contentLower.includes('my experience') ||
      contentLower.includes('review of')) {
    return 'SHOWCASE';
  }
  
  // Discovery intent detection
  if (contentLower.includes('looking for') || 
      contentLower.includes('need recommendation') || 
      contentLower.includes('suggest') ||
      contentLower.includes('recommendations') ||
      contentLower.includes('what is the best')) {
    return 'DISCOVERY';
  }
  
  // Default to general
  return 'GENERAL';
}

/**
 * Calculate affinity score between an opportunity and affiliate program
 */
function calculateAffinityScore(
  opportunity: RedditOpportunity,
  affiliateProgram: AffiliateProgram,
  categoryMatch: boolean,
  intent: ThreadIntent
): number {
  let score = 0;
  
  // Base score from opportunity score
  score += (opportunity.opportunityScore || 0) * 0.5;
  
  // Category match is a strong signal
  if (categoryMatch) {
    score += 20;
  }
  
  // Intent-based scoring
  switch(intent) {
    case 'DISCOVERY':
      score += 25; // High-value intent
      break;
    case 'QUESTION':
      score += 20; // Good value intent
      break;
    case 'COMPARISON':
      score += 15; // Medium value intent
      break;
    case 'SHOWCASE':
      score += 5;  // Lower opportunity but still valuable
      break;
    default:
      score += 0;  // General content is lowest value
  }
  
  // Check if the program name or keywords appear in the content
  const contentText = `${opportunity.title} ${opportunity.snippet || ''}`.toLowerCase();
  
  if (contentText.includes(affiliateProgram.name.toLowerCase())) {
    score += 15; // Direct mention of the product
  }
  
  if (affiliateProgram.tags) {
    for (const tag of affiliateProgram.tags) {
      if (contentText.includes(tag.toLowerCase())) {
        score += 5; // Related concept mentioned
        break;
      }
    }
  }
  
  // Cap at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Generate an explanation for the affinity score
 */
function generateRationale(
  opportunity: RedditOpportunity,
  affiliateProgram: AffiliateProgram,
  categoryMatch: boolean,
  intent: ThreadIntent
): string {
  const reasons = [];
  
  // Opportunity score reason
  if ((opportunity.opportunityScore || 0) > 70) {
    reasons.push('High-quality opportunity based on engagement metrics');
  } else if ((opportunity.opportunityScore || 0) > 40) {
    reasons.push('Moderate opportunity based on engagement metrics');
  } else {
    reasons.push('Lower quality opportunity based on engagement metrics');
  }
  
  // Category match
  if (categoryMatch) {
    reasons.push(`Subreddit category matches affiliate program's category (${affiliateProgram.category})`);
  } else {
    reasons.push('No direct category match between subreddit and affiliate program');
  }
  
  // Intent analysis
  switch (intent) {
    case 'DISCOVERY':
      reasons.push('User is actively seeking product recommendations');
      break;
    case 'COMPARISON':
      reasons.push('User is comparing products or solutions');
      break;
    case 'QUESTION':
      reasons.push('User is asking questions that our product could help answer');
      break;
    case 'SHOWCASE':
      reasons.push('User is showcasing their experience with a product/solution');
      break;
    default:
      reasons.push('General discussion that may be relevant to our product');
  }
  
  // Combine into rationale
  return reasons.join('. ') + '.';
}

/**
 * Determine the best approach (comment or post) based on intent and score
 */
function determineBestApproach(intent: ThreadIntent, score: number): 'COMMENT' | 'POST' | 'BOTH' {
  // For high-scoring opportunities, consider both approaches
  if (score > 85) {
    return 'BOTH';
  }
  
  // Intent-based approach
  switch (intent) {
    case 'DISCOVERY':
    case 'QUESTION':
      return 'COMMENT'; // Direct response to questions
    case 'COMPARISON':
      return score > 70 ? 'POST' : 'COMMENT'; // For high-quality comparison threads
    case 'SHOWCASE':
      return 'POST'; // Create our own showcase
    default:
      return score > 75 ? 'POST' : 'COMMENT';
  }
}

/**
 * Extract pain point from content
 */
function determinePainPoint(title: string, snippet: string): string {
  const content = (title + ' ' + snippet).toLowerCase();
  
  // Common pain point phrases
  const painPhrases = [
    { phrase: 'problem with', pain: 'Technical difficulties' },
    { phrase: 'trouble', pain: 'Operational challenges' },
    { phrase: 'difficult to', pain: 'Usability issues' },
    { phrase: 'too expensive', pain: 'Cost concerns' },
    { phrase: 'can\'t figure out', pain: 'Learning curve challenges' },
    { phrase: 'frustrated', pain: 'User frustration' },
    { phrase: 'not working', pain: 'Functionality issues' },
    { phrase: 'alternative to', pain: 'Dissatisfaction with current solution' },
    { phrase: 'help with', pain: 'Need for assistance' },
    { phrase: 'looking for', pain: 'Seeking solutions' },
  ];
  
  for (const { phrase, pain } of painPhrases) {
    if (content.includes(phrase)) {
      return pain;
    }
  }
  
  return 'Undefined pain point';
}

/**
 * Extract desire/gain from content
 */
function determineGainDesire(title: string, snippet: string): string {
  const content = (title + ' ' + snippet).toLowerCase();
  
  // Common gain phrases
  const gainPhrases = [
    { phrase: 'best way to', gain: 'Optimization' },
    { phrase: 'how to', gain: 'Knowledge acquisition' },
    { phrase: 'recommend', gain: 'Validated solutions' },
    { phrase: 'improve', gain: 'Performance enhancement' },
    { phrase: 'increase', gain: 'Growth' },
    { phrase: 'save time', gain: 'Efficiency' },
    { phrase: 'save money', gain: 'Cost reduction' },
    { phrase: 'easier way', gain: 'Simplification' },
    { phrase: 'better', gain: 'Quality improvement' },
    { phrase: 'solution', gain: 'Problem resolution' },
  ];
  
  for (const { phrase, gain } of gainPhrases) {
    if (content.includes(phrase)) {
      return gain;
    }
  }
  
  return 'Undefined gain desire';
}

/**
 * Extract mentioned competitive products
 */
function extractCompetitiveProducts(title: string, snippet: string): string[] {
  // This is a simplified version - a real implementation would use
  // a more sophisticated approach like NER or product database matching
  const products: string[] = [];
  const content = (title + ' ' + snippet);
  
  // Use a regex to find potential product names (capitalized multi-word phrases)
  const productRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
  const matches = content.match(productRegex);
  
  if (matches) {
    // Filter out common non-product phrases and add to products list
    return matches.filter(match => 
      !['United States', 'New York', 'Reddit', 'Microsoft Word'].includes(match)
    );
  }
  
  return products;
}

/**
 * Analyze sentiment of the content
 */
function analyzeSentiment(title: string, snippet: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const content = (title + ' ' + snippet).toLowerCase();
  
  // Simple keyword-based sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'helpful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'disappointing', 'problem'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of positiveWords) {
    if (content.includes(word)) {
      positiveCount++;
    }
  }
  
  for (const word of negativeWords) {
    if (content.includes(word)) {
      negativeCount++;
    }
  }
  
  if (positiveCount > 0 && negativeCount > 0) {
    return 'mixed';
  } else if (positiveCount > 0) {
    return 'positive';
  } else if (negativeCount > 0) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

/**
 * Calculate content urgency level
 */
function calculateUrgency(title: string, snippet: string): number {
  const content = (title + ' ' + snippet).toLowerCase();
  
  // Urgency indicators with weights
  const urgencyIndicators = [
    { phrase: 'urgent', weight: 3 },
    { phrase: 'asap', weight: 3 },
    { phrase: 'immediately', weight: 3 },
    { phrase: 'today', weight: 2 },
    { phrase: 'tomorrow', weight: 2 },
    { phrase: 'soon', weight: 1 },
    { phrase: 'quickly', weight: 2 },
    { phrase: 'help!', weight: 2 },
    { phrase: 'emergency', weight: 3 },
    { phrase: 'deadline', weight: 2 },
  ];
  
  let urgencyScore = 5; // Default medium urgency
  
  for (const { phrase, weight } of urgencyIndicators) {
    if (content.includes(phrase)) {
      urgencyScore += weight;
    }
  }
  
  // Bound between 1-10
  return Math.min(Math.max(urgencyScore, 1), 10);
}

/**
 * Determine product fit factors
 */
function determineFitFactors(opportunity: RedditOpportunity, affiliateProgram: AffiliateProgram): string[] {
  // This is a simplified version - would use more sophisticated matching in production
  const factors = [];
  const content = `${opportunity.title} ${opportunity.snippet || ''}`.toLowerCase();
  
  // Check for program category match in content
  if (affiliateProgram.category && content.includes(affiliateProgram.category.toLowerCase())) {
    factors.push(`Content mentions ${affiliateProgram.category}`);
  }
  
  // Check for program features match
  if (affiliateProgram.tags) {
    for (const tag of affiliateProgram.tags) {
      if (content.includes(tag.toLowerCase())) {
        factors.push(`Content discusses ${tag}`);
      }
    }
  }
  
  // Add default factors based on program
  factors.push(`Affiliate program in ${affiliateProgram.category || 'relevant'} category`);
  
  if (affiliateProgram.commissionRate && affiliateProgram.commissionRate > 0.2) {
    factors.push(`High commission program (${(affiliateProgram.commissionRate * 100).toFixed(0)}%)`);
  }
  
  return factors;
}

/**
 * Anticipate possible objections
 */
function anticipateObjections(opportunity: RedditOpportunity, affiliateProgram: AffiliateProgram): string[] {
  const objections = [];
  
  // Add default objections based on typical affiliate marketing challenges
  objections.push('Potential skepticism of affiliate recommendations');
  
  // Check for price sensitivity
  const content = `${opportunity.title} ${opportunity.snippet || ''}`.toLowerCase();
  if (content.includes('expensive') || content.includes('price') || content.includes('cost')) {
    objections.push('Price sensitivity indicated in content');
  }
  
  // Check for negative sentiment towards similar products
  if (content.includes('terrible') || content.includes('bad experience') || 
      content.includes('waste of money') || content.includes('not worth')) {
    objections.push('Negative sentiment toward similar products');
  }
  
  return objections;
}

/**
 * Suggest content angles based on intent
 */
function suggestContentAngles(intent: ThreadIntent, opportunity: RedditOpportunity, affiliateProgram: AffiliateProgram): string[] {
  const angles = [];
  
  // Common angles for different intents
  switch (intent) {
    case 'DISCOVERY':
      angles.push('Product recommendation with personal experience');
      angles.push('Comparison with alternatives');
      angles.push('Success story with concrete results');
      break;
    case 'COMPARISON':
      angles.push('Balanced comparison highlighting product strengths');
      angles.push('Use case scenarios where product excels');
      angles.push('Value proposition compared to competitors');
      break;
    case 'QUESTION':
      angles.push('Direct problem-solution approach');
      angles.push('Step-by-step guide using product');
      angles.push('Expert advice incorporating product');
      break;
    case 'SHOWCASE':
      angles.push('Complementary product recommendation');
      angles.push('Enhancement or additional solution');
      angles.push('Alternative approach with product');
      break;
    default:
      angles.push('Value-add information with product mention');
      angles.push('Problem-solution scenario');
      angles.push('Personal experience story');
  }
  
  return angles;
}

/**
 * Suggest key messages based on intent
 */
function suggestKeyMessages(intent: ThreadIntent, opportunity: RedditOpportunity, affiliateProgram: AffiliateProgram): string[] {
  const messages = [];
  
  // Add program-specific messaging
  messages.push(`How ${affiliateProgram.name} helps with ${opportunity.keyword}`);
  
  // Add intent-specific messaging
  switch (intent) {
    case 'DISCOVERY':
      messages.push(`Why ${affiliateProgram.name} stands out from alternatives`);
      messages.push('Personal success story with measurable outcomes');
      break;
    case 'COMPARISON':
      messages.push(`Key advantages of ${affiliateProgram.name} in this category`);
      messages.push('Honest pros and cons assessment');
      break;
    case 'QUESTION':
      messages.push('Clear solution to the specific problem');
      messages.push('Additional tips for better results');
      break;
    case 'SHOWCASE':
      messages.push('Complementary tool or approach');
      messages.push('How to enhance results further');
      break;
    default:
      messages.push('Helpful information with subtle product reference');
      messages.push('Value-first approach with genuine advice');
  }
  
  return messages;
}

/**
 * Determine appropriate call-to-action strength
 */
function determineCTAStrength(intent: ThreadIntent, score: number): number {
  // Base CTA strength on opportunity score
  let ctaStrength = Math.round(score / 10);
  
  // Adjust based on intent
  switch (intent) {
    case 'DISCOVERY':
      ctaStrength += 2; // Can be more direct in discovery threads
      break;
    case 'QUESTION':
      ctaStrength += 1; // Somewhat direct in question threads
      break;
    case 'COMPARISON':
      ctaStrength += 0; // Neutral in comparison threads
      break;
    case 'SHOWCASE':
      ctaStrength -= 1; // More subtle in showcase threads
      break;
    default:
      ctaStrength -= 2; // Very subtle in general discussions
  }
  
  // Bound between 1-10
  return Math.min(Math.max(ctaStrength, 1), 10);
}

/**
 * Create a fallback analysis when normal analysis fails
 */
function createFallbackAnalysis(opportunity: RedditOpportunity): OpportunityAnalysis {
  return {
    keyPoints: [
      `Post in subreddit ${opportunity.subreddit}`,
      `Keyword focus: ${opportunity.keyword}`,
    ],
    audience: {
      expectedDemographics: ['Unknown'],
      interests: [],
      pain: 'Not determined',
      gain: 'Not determined'
    },
    context: {
      userIntent: 'GENERAL',
      competitiveProducts: [],
      sentiment: 'neutral',
      urgency: 5
    },
    affiliateMatch: {
      score: opportunity.opportunityScore || 50,
      rationale: 'Basic opportunity assessment based on limited data',
      productFit: ['Potential match based on keyword'],
      objections: ['Insufficient data for detailed analysis']
    },
    recommendations: {
      bestApproach: 'COMMENT',
      contentAngles: ['Value-first approach', 'Helpful information with subtle product reference'],
      keyMessaging: ['Focus on solving user problem', 'Authentic, helpful response'],
      callToActionStrength: 4
    }
  };
}