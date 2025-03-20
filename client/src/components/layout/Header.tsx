import { useState } from "react";
import { Menu, Bell, User } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const [searchText, setSearchText] = useState("");
  
  const handleToggleSidebar = () => {
    // Toggle sidebar visibility on mobile
    const sidebar = document.querySelector('.bg-primary-800');
    sidebar?.classList.toggle('hidden');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center md:hidden">
        <button 
          type="button" 
          className="text-gray-600 hover:text-gray-900"
          onClick={handleToggleSidebar}
        >
          <Menu />
        </button>
        <div className="ml-3">
          <span className="font-heading text-lg font-semibold text-primary-800">RedditAffiliateAI</span>
        </div>
      </div>
      
      <div className="hidden md:flex items-center rounded-md bg-gray-100 px-3 py-1.5 flex-1 max-w-xl mx-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input 
          type="text" 
          placeholder="Search campaigns, subreddits, or reports..." 
          className="bg-transparent border-none w-full focus:outline-none text-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="relative text-gray-600 hover:text-primary-600">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center p-0">3</Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-4 py-2 font-medium border-b">Notifications</div>
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
        
        <div className="flex items-center">
          <div className="hidden md:block text-right mr-2">
            <div className="text-sm font-medium text-gray-900">Alex Smith</div>
            <div className="text-xs text-gray-500">Pro Plan</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center">
                <Avatar className="h-8 w-8 border-2 border-primary-300">
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
