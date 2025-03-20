import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface ScheduledPost {
  id: number;
  title: string;
  scheduledTime: string;
  subreddit: string;
  campaignId: number;
}

interface SchedulingCalendarProps {
  posts: ScheduledPost[];
}

const SchedulingCalendar = ({ posts }: SchedulingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  const { data: campaigns } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  // Generate calendar days when month/year changes
  useEffect(() => {
    const days = generateCalendarDays(currentYear, currentMonth);
    setCalendarDays(days);
  }, [currentMonth, currentYear]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setCurrentDate(today);
  };

  // Group posts by date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledTime);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get day class based on posts and current date
  const getDayClass = (day: Date) => {
    const isToday = isSameDay(day, new Date());
    const isSelectedMonth = day.getMonth() === currentMonth;
    const hasEvents = getPostsForDate(day).length > 0;
    
    let className = "relative h-14 border border-gray-200 p-1 transition duration-150 ease-in-out";
    
    if (!isSelectedMonth) {
      className += " bg-gray-50 text-gray-400";
    } else if (isToday) {
      className += " bg-blue-50";
    }
    
    if (hasEvents) {
      className += " font-semibold";
    }
    
    return className;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div 
            key={day} 
            className="text-center font-semibold text-sm py-2 border-b border-gray-200"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div key={index} className={getDayClass(day)}>
            <div className="flex justify-between">
              <span className={isSameDay(day, new Date()) ? "h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm" : "text-sm"}>
                {day.getDate()}
              </span>
              
              {getPostsForDate(day).length > 0 && (
                <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                  {getPostsForDate(day).length}
                </Badge>
              )}
            </div>
            
            <div className="mt-1 overflow-y-auto max-h-[60px]">
              {getPostsForDate(day).slice(0, 2).map((post) => (
                <div 
                  key={post.id} 
                  className="text-xs truncate mb-0.5 bg-primary-50 text-primary-700 px-1 py-0.5 rounded"
                >
                  <Link href={`/scheduling/${post.id}`}>
                    <span className="cursor-pointer">
                      {formatTime(post.scheduledTime)} - {post.title || post.subreddit}
                    </span>
                  </Link>
                </div>
              ))}
              
              {getPostsForDate(day).length > 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-5 w-full text-xs px-1 py-0">
                      + {getPostsForDate(day).length - 2} more
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {getPostsForDate(day).slice(2).map((post) => (
                      <DropdownMenuItem key={post.id} asChild>
                        <Link href={`/scheduling/${post.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{post.title || "Comment"}</span>
                            <span className="text-xs text-gray-500">
                              {formatTime(post.scheduledTime)} - {post.subreddit}
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
function generateCalendarDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Get day of week of first day (0 = Sunday, 6 = Saturday)
  const firstDayWeekday = firstDayOfMonth.getDay();
  
  // Array to hold all calendar days
  const days: Date[] = [];
  
  // Add days from previous month to fill the first row
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = 0; i < firstDayWeekday; i++) {
    const day = prevMonthLastDay - firstDayWeekday + i + 1;
    days.push(new Date(year, month - 1, day));
  }
  
  // Add all days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // Add days from next month to complete the last row (total cells should be divisible by 7)
  const remainingCells = 7 - (days.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(year, month + 1, day));
    }
  }
  
  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default SchedulingCalendar;
