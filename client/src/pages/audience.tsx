import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Audience() {
  const [location, setLocation] = useLocation();

  // Temporary: redirect to dashboard if accessed directly
  useEffect(() => {
    const timer = setTimeout(() => {
      // Uncomment once the page is implemented
      // setLocation("/dashboard");
    }, 300000); // 5 minutes
    
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Audience Analytics</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Audience Insights</CardTitle>
            <CardDescription>
              Understand your audience demographics and engagement patterns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-primary-50 dark:bg-primary-900/30 p-3 mb-4">
                <Users className="h-8 w-8 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Audience Analytics Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This feature is under development. Soon you'll be able to analyze audience demographics,
                engagement patterns, and behavior across your Reddit marketing campaigns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}