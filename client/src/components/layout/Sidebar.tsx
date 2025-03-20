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
  Bot
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Sidebar = () => {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

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

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/campaigns", label: "Campaigns", icon: <Megaphone className="w-5 h-5" /> },
    { path: "/content-library", label: "Content Library", icon: <PenTool className="w-5 h-5" /> },
    { path: "/scheduling", label: "Scheduling", icon: <Calendar className="w-5 h-5" /> },
    { path: "/analytics", label: "Analytics", icon: <BarChart2 className="w-5 h-5" /> },
    { path: "/affiliate-programs", label: "Affiliate Programs", icon: <Handshake className="w-5 h-5" /> },
  ];

  const bottomLinks = [
    { path: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
    { path: "/help", label: "Help & Support", icon: <HelpCircle className="w-5 h-5" /> },
  ];

  if (isMobile && location !== "/") {
    return null;
  }

  return (
    <div className="bg-primary-800 text-white w-64 flex-shrink-0 hidden md:block transition-all duration-300 ease-in-out">
      <div className="p-4 flex items-center">
        <div className="bg-primary-400 p-2 rounded-lg mr-2">
          <Bot className="text-white h-5 w-5" />
        </div>
        <h1 className="font-heading text-xl font-bold text-white">RedditAffiliateAI</h1>
      </div>
      
      <div className="px-4 py-2">
        <div className="bg-primary-700/70 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-100 font-medium">Active Campaigns</span>
            <span className="bg-primary-500 text-xs rounded-full px-2 py-0.5 font-semibold">
              {activeCampaigns}
            </span>
          </div>
          <div className="text-xs text-primary-200 mt-1">Last updated: 2 hours ago</div>
        </div>
      </div>
      
      <nav className="mt-2">
        <ul>
          {navLinks.map((link) => (
            <li className="mb-1" key={link.path}>
              <Link 
                href={link.path} 
                className={`block px-4 py-2 text-primary-100 hover:bg-primary-700 rounded-lg flex items-center ${
                  isActive(link.path) ? "bg-primary-700" : ""
                }`}
              >
                {link.icon}
                <span className="ml-2">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 py-2 mt-auto absolute bottom-0 left-0 right-0 mb-4">
        <div className="pt-4 border-t border-primary-700">
          {bottomLinks.map((link) => (
            <Link 
              key={link.path}
              href={link.path} 
              className={`block px-4 py-2 text-primary-100 hover:bg-primary-700 rounded-lg flex items-center ${
                isActive(link.path) ? "bg-primary-700" : ""
              }`}
            >
              {link.icon}
              <span className="ml-2">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
