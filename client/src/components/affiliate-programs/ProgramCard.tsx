import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Edit, Trash, CreditCard, Calendar, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface ProgramCardProps {
  program?: {
    id: number;
    name: string;
    description?: string;
    website?: string;
    commissionRate?: number;
    commissionType?: string;
    payoutThreshold?: number;
    payoutFrequency?: string;
    category?: string;
    active?: boolean;
  };
  loading?: boolean;
  onDelete?: (id: number) => void;
}

const ProgramCard = ({ program, loading = false, onDelete }: ProgramCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-1" />
          <Skeleton className="h-4 w-2/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!program) {
    return null;
  }

  const { 
    id, 
    name, 
    description, 
    website, 
    commissionRate, 
    commissionType, 
    payoutThreshold, 
    payoutFrequency, 
    category, 
    active 
  } = program;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        {category && (
          <CardDescription>{category}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {description || "No description provided"}
        </p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm">
              {commissionRate !== undefined 
                ? `${commissionRate}${commissionType === "percentage" ? "%" : "$"}`
                : "N/A"}
            </span>
          </div>
          
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm">
              {payoutThreshold !== undefined ? `$${payoutThreshold}` : "No minimum"}
            </span>
          </div>
          
          <div className="flex items-center col-span-2">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm">
              {payoutFrequency 
                ? `${payoutFrequency.charAt(0).toUpperCase() + payoutFrequency.slice(1)} payouts`
                : "No payout schedule"}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="justify-between pt-2">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/affiliate-programs/${id}`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(id)}
            >
              <Trash className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
        
        {website && (
          <Button variant="ghost" size="sm" className="text-gray-500" asChild>
            <a href={website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Visit
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;
