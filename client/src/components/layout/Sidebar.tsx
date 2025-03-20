import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Megaphone, 
  PenTool, 
  Calendar, 
  BarChart2, 
  Handshake, 
  Settings, 
  HelpCircle,
  Bot,
  DollarSign,
  Link as LinkIcon,
  Users
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Sidebar = () => {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    staleTime: 60000 // 1 minute
  });

  const activeCampaigns = stats?.activeCampaigns || 0;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isActive = (path: string) => {
    return location === path || (path !== "/" && location.startsWith(path));
  };

  // Main navigation links
  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/campaigns", label: "Campaigns", icon: <Megaphone className="w-5 h-5" /> },
    { path: "/content-library", label: "Content Library", icon: <PenTool className="w-5 h-5" /> },
    { path: "/scheduling", label: "Scheduling", icon: <Calendar className="w-5 h-5" /> },
  ];

  // Affiliate marketing specific links
  const affiliateLinks = [
    { path: "/affiliate-programs", label: "Affiliate Programs", icon: <Handshake className="w-5 h-5" /> },
    { path: "/commissions", label: "Commissions", icon: <DollarSign className="w-5 h-5" /> },
    { path: "/affiliate-links", label: "Link Management", icon: <LinkIcon className="w-5 h-5" /> },
  ];

  // Analytics links
  const analyticsLinks = [
    { path: "/analytics", label: "Performance", icon: <BarChart2 className="w-5 h-5" /> },
    { path: "/audience", label: "Audience", icon: <Users className="w-5 h-5" /> },
  ];

  // Bottom links
  const bottomLinks = [
    { path: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
    { path: "/help", label: "Help & Support", icon: <HelpCircle className="w-5 h-5" /> },
  ];

  // Don't render sidebar on mobile if not at the home page
  if (isMobile && location !== "/") {
    return null;
  }

  return (
    <aside className="bg-white dark:bg-primary-800 text-gray-800 dark:text-white border-r border-gray-200 dark:border-primary-700 w-64 flex-shrink-0 h-screen sticky top-0 md:block transition-all duration-300 ease-in-out overflow-y-auto">
      {/* Logo and branding */}
      <div className="p-4 flex items-center">
        <div className="bg-primary-500 dark:bg-primary-400 p-2 rounded-lg mr-2">
          <Bot className="text-white h-5 w-5" />
        </div>
        <h1 className="font-heading text-xl font-bold text-primary-800 dark:text-white">RedditAffiliateAI</h1>
      </div>
      
      {/* Campaign Stats */}
      <div className="px-4 py-2">
        <div className="bg-gray-100 dark:bg-primary-700/70 rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-primary-100 font-medium">Active Campaigns</span>
            <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
              {activeCampaigns}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-primary-200 mt-1">Last updated: 2 hours ago</div>
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="mt-2">
        <div className="px-4 py-2">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-2">Main</h2>
          <ul>
            {navLinks.map((link) => (
              <li className="mb-1" key={link.path}>
                <Link 
                  href={link.path} 
                  className={`block px-4 py-2 text-gray-700 dark:text-primary-100 hover:bg-gray-100 dark:hover:bg-primary-700 rounded-lg flex items-center ${
                    isActive(link.path) ? "bg-gray-100 dark:bg-primary-700 font-medium" : ""
                  }`}
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Affiliate Section */}
        <div className="px-4 py-2 mt-4">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-2">Affiliate Management</h2>
          <ul>
            {affiliateLinks.map((link) => (
              <li className="mb-1" key={link.path}>
                <Link 
                  href={link.path} 
                  className={`block px-4 py-2 text-gray-700 dark:text-primary-100 hover:bg-gray-100 dark:hover:bg-primary-700 rounded-lg flex items-center ${
                    isActive(link.path) ? "bg-gray-100 dark:bg-primary-700 font-medium" : ""
                  }`}
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Analytics Section */}
        <div className="px-4 py-2 mt-4">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-2">Analytics</h2>
          <ul>
            {analyticsLinks.map((link) => (
              <li className="mb-1" key={link.path}>
                <Link 
                  href={link.path} 
                  className={`block px-4 py-2 text-gray-700 dark:text-primary-100 hover:bg-gray-100 dark:hover:bg-primary-700 rounded-lg flex items-center ${
                    isActive(link.path) ? "bg-gray-100 dark:bg-primary-700 font-medium" : ""
                  }`}
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      {/* Bottom Links */}
      <div className="px-4 py-2 mt-auto border-t border-gray-200 dark:border-primary-700 sticky bottom-0 bg-white dark:bg-primary-800 pb-4 pt-4 mt-8">
        <ul>
          {bottomLinks.map((link) => (
            <li className="mb-1" key={link.path}>
              <Link 
                href={link.path} 
                className={`block px-4 py-2 text-gray-700 dark:text-primary-100 hover:bg-gray-100 dark:hover:bg-primary-700 rounded-lg flex items-center ${
                  isActive(link.path) ? "bg-gray-100 dark:bg-primary-700 font-medium" : ""
                }`}
              >
                {link.icon}
                <span className="ml-2">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
