// Client-side configuration settings

// API base URL
export const API_BASE_URL = '/api';

// Default date format
export const DEFAULT_DATE_FORMAT = 'MMM dd, yyyy';

// Default time format
export const DEFAULT_TIME_FORMAT = 'h:mm a';

// Datetime format
export const DEFAULT_DATETIME_FORMAT = 'MMM dd, yyyy h:mm a';

// Pagination settings
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50]
};

// Toast notification durations (in milliseconds)
export const TOAST_DURATION = {
  short: 3000,
  medium: 5000,
  long: 8000
};

// Chart colors
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  accent: 'hsl(var(--accent))',
  background: 'hsl(var(--background))'
};

// Feature flags
export const FEATURES = {
  enableRedditAuth: true,
  enableKeywordDiscovery: true,
  enableContentGeneration: true,
  enableScheduling: true,
  enableAnalytics: true
};

// Dashboard settings
export const DASHBOARD = {
  refreshInterval: 60000, // 1 minute
  statsCards: [
    { id: 'active-campaigns', title: 'Active Campaigns', icon: 'Rocket' },
    { id: 'monthly-clicks', title: 'Monthly Clicks', icon: 'MousePointerClick' },
    { id: 'conversion-rate', title: 'Conversion Rate', icon: 'PercentSquare' },
    { id: 'month-revenue', title: 'Monthly Revenue', icon: 'DollarSign' }
  ]
};