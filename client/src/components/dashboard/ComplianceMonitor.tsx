import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ComplianceMonitor = () => {
  const { data: complianceStatus, isLoading } = useQuery({
    queryKey: ['/api/compliance-status'],
  });

  return (
    <Card className="fade-in" style={{ animationDelay: "0.9s" }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-primary-800">Compliance Monitor</h3>
          {isLoading ? (
            <Skeleton className="h-6 w-20 rounded-full" />
          ) : (
            <Badge className="bg-green-100 text-green-700">All Clear</Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Track compliance with subreddit rules and Reddit TOS.
        </p>
        
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-lg mb-4" />
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <Check className="text-green-600 h-4 w-4" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">All campaigns compliant</h4>
                <p className="text-xs text-green-700 mt-0.5">
                  Your campaigns are following Reddit TOS and subreddit rules.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          {isLoading ? (
            // Loading skeletons for progress bars
            Array(3).fill(0).map((_, index) => (
              <div className="flex items-center justify-between" key={index}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-32 rounded-full" />
              </div>
            ))
          ) : (
            // Actual compliance metrics
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm">API Rate Limit</div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <Progress 
                    value={complianceStatus?.apiRateLimit?.remainingPercent || 0} 
                    className="bg-primary-500 h-2 rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Posting Frequency</div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <Progress 
                    value={complianceStatus?.postingFrequency?.value || 0} 
                    className="bg-primary-500 h-2 rounded-full" 
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Content Authenticity</div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <Progress 
                    value={complianceStatus?.contentAuthenticity?.value || 0} 
                    className="bg-primary-500 h-2 rounded-full" 
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center"
        >
          <Shield className="h-4 w-4 mr-2" />
          Run Compliance Check
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComplianceMonitor;
