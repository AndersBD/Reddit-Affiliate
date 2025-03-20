import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  changeValue: string | number;
  changeDirection: "up" | "down" | "neutral";
  animationDelay?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor, 
  changeValue, 
  changeDirection,
  animationDelay = "0s"
}: StatsCardProps) => {
  return (
    <Card 
      className="fade-in dark:bg-gray-800 dark:border-gray-700"
      style={{ 
        animationDelay: animationDelay,
        animation: "fadeIn 0.4s ease-in-out"
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-300 mt-1">{value}</h3>
          </div>
          <div className={`${iconBgColor} p-3 rounded-full`}>
            {icon}
          </div>
        </div>
        <div className={`mt-3 text-xs flex items-center ${
          changeDirection === "up" 
            ? "text-success-500 dark:text-success-400" 
            : changeDirection === "down" 
              ? "text-danger-500 dark:text-danger-400" 
              : "text-gray-500 dark:text-gray-400"
        }`}>
          {changeDirection === "up" ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : changeDirection === "down" ? (
            <ArrowDown className="h-3 w-3 mr-1" />
          ) : null}
          <span>{changeValue}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
