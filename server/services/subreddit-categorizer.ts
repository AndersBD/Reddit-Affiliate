import { storage } from '../storage';
import { SubredditCategory, InsertSubredditCategory, SubredditCategoryMap, InsertSubredditCategoryMap, Subreddit } from '@shared/schema';

// Standard categories for affiliate marketing purposes
const STANDARD_CATEGORIES = [
  {
    name: 'Technology',
    description: 'Tech gadgets, software, and hardware discussions',
  },
  {
    name: 'Finance',
    description: 'Personal finance, investing, and money management',
  },
  {
    name: 'Productivity',
    description: 'Productivity tools, time management, and organization',
  },
  {
    name: 'Health & Fitness',
    description: 'Health products, fitness gear, nutrition supplements',
  },
  {
    name: 'Education',
    description: 'Online courses, educational resources, learning tools',
  },
  {
    name: 'Gaming',
    description: 'Video games, gaming hardware, game development',
  },
  {
    name: 'Home & Living',
    description: 'Home goods, smart home devices, furniture',
  },
  {
    name: 'Style & Fashion',
    description: 'Clothing, accessories, beauty products',
  },
  {
    name: 'Travel',
    description: 'Travel gear, accessories, services',
  },
  {
    name: 'Creative Tools',
    description: 'Software and hardware for designers, artists, photographers',
  },
  {
    name: 'Business',
    description: 'Business software, entrepreneurship resources, B2B products',
  },
  {
    name: 'Entertainment',
    description: 'Streaming services, entertainment products',
  }
];

// Keywords and phrases associated with each category for classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Technology': [
    'tech', 'gadget', 'computer', 'laptop', 'smartphone', 'software', 'hardware', 'programming', 
    'code', 'developer', 'app', 'digital', 'electronics', 'ai', 'artificial intelligence', 'machine learning'
  ],
  'Finance': [
    'money', 'invest', 'finance', 'stock', 'crypto', 'trading', 'budget', 'saving', 'financial',
    'wealth', 'income', 'economics', 'banking', 'loan', 'debt', 'credit'
  ],
  'Productivity': [
    'productivity', 'workflow', 'efficiency', 'organize', 'planning', 'management', 'task', 'project',
    'time management', 'focus', 'goal', 'habit', 'self-improvement', 'todo', 'optimization'
  ],
  'Health & Fitness': [
    'health', 'fitness', 'workout', 'exercise', 'gym', 'nutrition', 'diet', 'wellness', 'supplement',
    'protein', 'vitamin', 'weight loss', 'muscle', 'training', 'cardio', 'yoga', 'meditation'
  ],
  'Education': [
    'education', 'learn', 'course', 'study', 'teaching', 'student', 'academic', 'school', 'college',
    'university', 'degree', 'knowledge', 'skill', 'training', 'tutorial', 'certification'
  ],
  'Gaming': [
    'game', 'gaming', 'esport', 'console', 'playstation', 'xbox', 'nintendo', 'steam', 'mmo', 'fps',
    'rpg', 'gamer', 'twitch', 'streaming', 'controller', 'headset', 'gpu'
  ],
  'Home & Living': [
    'home', 'house', 'decor', 'furniture', 'kitchen', 'bedroom', 'bathroom', 'living room', 'cleaning',
    'garden', 'smart home', 'appliance', 'decoration', 'interior design', 'organization'
  ],
  'Style & Fashion': [
    'fashion', 'style', 'clothes', 'outfit', 'wear', 'clothing', 'accessory', 'beauty', 'makeup',
    'cosmetic', 'skincare', 'hair', 'dress', 'shoe', 'bag', 'luxury', 'brand'
  ],
  'Travel': [
    'travel', 'trip', 'vacation', 'destination', 'tourism', 'tourist', 'flight', 'hotel', 'booking',
    'backpack', 'luggage', 'adventure', 'journey', 'explore', 'nomad'
  ],
  'Creative Tools': [
    'design', 'creative', 'photoshop', 'illustrator', 'graphic', 'art', 'artist', 'drawing', 'painting',
    'camera', 'photography', 'video', 'film', 'editing', 'animation', 'portfolio'
  ],
  'Business': [
    'business', 'entrepreneur', 'startup', 'company', 'enterprise', 'industry', 'corporate', 'management',
    'marketing', 'sales', 'b2b', 'client', 'customer', 'service', 'consulting', 'strategy'
  ],
  'Entertainment': [
    'entertainment', 'movie', 'tv', 'show', 'film', 'stream', 'netflix', 'music', 'podcast', 'media',
    'youtube', 'channel', 'video', 'content', 'creator', 'subscription'
  ]
};

/**
 * Initialize the standard subreddit categories if they don't exist
 */
export async function initializeCategories(): Promise<void> {
  // Check if categories already exist
  const existingCategories = await storage.getSubredditCategories();
  
  if (existingCategories.length === 0) {
    console.log('Initializing standard subreddit categories...');
    
    // Create each category
    for (const category of STANDARD_CATEGORIES) {
      await storage.createSubredditCategory({
        name: category.name,
        description: category.description
      });
    }
    
    console.log(`Created ${STANDARD_CATEGORIES.length} standard categories`);
  }
}

/**
 * Calculate the relevance score between a subreddit and a category
 * Higher score means more relevant (0-1)
 */
function calculateRelevanceScore(subreddit: Subreddit, categoryName: string): number {
  // Get keywords for this category
  const categoryKeywords = CATEGORY_KEYWORDS[categoryName] || [];
  
  if (categoryKeywords.length === 0) {
    return 0;
  }
  
  let matchCount = 0;
  const subredditText = `${subreddit.name} ${subreddit.description || ''} ${subreddit.primaryTopics?.join(' ') || ''} ${subreddit.categoryTags?.join(' ') || ''}`.toLowerCase();
  
  // Count how many category keywords appear in the subreddit text
  for (const keyword of categoryKeywords) {
    if (subredditText.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }
  
  // Calculate score as a percentage of matched keywords
  return Math.min(1, matchCount / Math.min(categoryKeywords.length, 10));
}

/**
 * Categorize a subreddit based on its description and metadata
 * This will create mappings between the subreddit and relevant categories
 */
export async function categorizeSubreddit(subredditId: number): Promise<SubredditCategoryMap[]> {
  // Get subreddit info
  const subreddit = await storage.getSubreddit(subredditId);
  if (!subreddit) {
    throw new Error(`Subreddit with ID ${subredditId} not found`);
  }
  
  // Get all categories
  const categories = await storage.getSubredditCategories();
  
  const mappings: SubredditCategoryMap[] = [];
  
  // Calculate relevance for each category
  for (const category of categories) {
    const relevanceScore = calculateRelevanceScore(subreddit, category.name);
    
    // Only create mappings for categories with some relevance
    if (relevanceScore > 0.1) {
      // Check if mapping already exists
      const existingMappings = await storage.getSubredditCategoryMapsBySubreddit(subredditId);
      const existingForCategory = existingMappings.find(m => m.categoryId === category.id);
      
      if (existingForCategory) {
        // Update existing mapping
        await storage.updateSubredditCategoryMap(existingForCategory.id, {
          relevanceScore
        });
        
        mappings.push({
          ...existingForCategory,
          relevanceScore
        });
      } else {
        // Create new mapping
        const newMapping = await storage.createSubredditCategoryMap({
          subredditId,
          categoryId: category.id,
          relevanceScore
        });
        
        mappings.push(newMapping);
      }
    }
  }
  
  return mappings;
}

/**
 * Batch categorize all subreddits in the database
 */
export async function categorizeAllSubreddits(): Promise<number> {
  const subreddits = await storage.getSubreddits();
  let mappingCount = 0;
  
  for (const subreddit of subreddits) {
    const mappings = await categorizeSubreddit(subreddit.id);
    mappingCount += mappings.length;
  }
  
  return mappingCount;
}

/**
 * Find subreddits in a specific category, sorted by relevance
 */
export async function getSubredditsByCategory(categoryName: string, limit: number = 10): Promise<{subreddit: Subreddit, relevanceScore: number}[]> {
  // Get category
  const category = await storage.getSubredditCategoryByName(categoryName);
  if (!category) {
    throw new Error(`Category ${categoryName} not found`);
  }
  
  // Get mappings for this category
  const subreddits = await storage.getSubredditsByCategoryId(category.id);
  
  // Get full subreddit objects and their relevance scores
  const result: {subreddit: Subreddit, relevanceScore: number}[] = [];
  
  for (const subreddit of subreddits) {
    const mappings = await storage.getSubredditCategoryMapsBySubreddit(subreddit.id);
    const relevantMapping = mappings.find(m => m.categoryId === category.id);
    
    if (relevantMapping) {
      result.push({
        subreddit,
        relevanceScore: relevantMapping.relevanceScore
      });
    }
  }
  
  // Sort by relevance (highest first) and limit
  return result
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Get the top categories for a subreddit
 */
export async function getCategoriesForSubreddit(subredditId: number): Promise<{category: SubredditCategory, relevanceScore: number}[]> {
  const categories = await storage.getCategoriesBySubredditId(subredditId);
  const mappings = await storage.getSubredditCategoryMapsBySubreddit(subredditId);
  
  // Create array of categories with their relevance scores
  return categories.map(category => {
    const mapping = mappings.find(m => m.categoryId === category.id);
    return {
      category,
      relevanceScore: mapping?.relevanceScore || 0
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Find the most relevant subreddits for an affiliate program based on its category and target audience
 */
export async function findRelevantSubredditsForProgram(affiliateProgramId: number, limit: number = 10): Promise<{subreddit: Subreddit, relevanceScore: number}[]> {
  // Get affiliate program
  const program = await storage.getAffiliateProgram(affiliateProgramId);
  if (!program) {
    throw new Error(`Affiliate program with ID ${affiliateProgramId} not found`);
  }
  
  // Use the program's category as the main category to search for
  if (!program.category) {
    return [];
  }
  
  return await getSubredditsByCategory(program.category, limit);
}