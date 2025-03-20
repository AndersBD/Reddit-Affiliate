import { useState, useEffect } from "react";
import { Menu, Bell, User, Moon, Sun } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [searchText, setSearchText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Otherwise check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Apply theme on initial render
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const handleToggleSidebar = () => {
    // Toggle sidebar visibility on mobile
    const sidebar = document.querySelector('aside');
    sidebar?.classList.toggle('hidden');
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center md:hidden">
        <button 
          type="button" 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          onClick={handleToggleSidebar}
        >
          <Menu />
        </button>
        <div className="ml-3">
          <span className="font-heading text-lg font-semibold text-primary-800 dark:text-primary-300">RedditAffiliateAI</span>
        </div>
      </div>
      
      <div className="hidden md:flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1.5 flex-1 max-w-xl mx-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input 
          type="text" 
          placeholder="Search campaigns, subreddits, or reports..." 
          className="bg-transparent border-none w-full focus:outline-none text-sm dark:text-gray-200 dark:placeholder:text-gray-400"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center p-0">3</Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-4 py-2 font-medium border-b dark:border-gray-700">Notifications</div>
            <div className="py-2">
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start">
                <div className="font-medium text-sm">New comments received</div>
                <div className="text-xs text-muted-foreground">Your Reddit post received 5 new comments</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start">
                <div className="font-medium text-sm">Campaign goal reached</div>
                <div className="text-xs text-muted-foreground">AI Writing Assistant campaign reached its click target</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start">
                <div className="font-medium text-sm">Scheduled posts published</div>
                <div className="text-xs text-muted-foreground">3 scheduled posts were published successfully</div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User profile */}
        <div className="flex items-center">
          <div className="hidden md:block text-right mr-2">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Alex Smith</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pro Plan</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center">
                <Avatar className="h-8 w-8 border-2 border-primary-300 dark:border-primary-700">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User profile" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Account Settings</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Billing</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-500">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
