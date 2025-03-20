import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { 
  PlusCircle, 
  Search, 
  Filter 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ProgramForm from "@/components/affiliate-programs/ProgramForm";
import ProgramCard from "@/components/affiliate-programs/ProgramCard";
import { deleteAffiliateProgram } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AffiliatePrograms = () => {
  const [matchParams, params] = useRoute("/affiliate-programs/:id");
  const [matchNew] = useRoute("/affiliate-programs/new");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: programs, isLoading } = useQuery({
    queryKey: ['/api/affiliate-programs'],
  });

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: deleteAffiliateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate-programs'] });
      toast({
        title: "Program Deleted",
        description: "The affiliate program has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error deleting the program.",
        variant: "destructive",
      });
    }
  });

  // If we're on the edit or new route, show the form
  if (matchParams && params.id !== "new") {
    return <ProgramForm programId={params.id} />;
  }

  if (matchNew) {
    return <ProgramForm />;
  }

  // Filter programs
  const filteredPrograms = !isLoading && programs
    ? programs
        .filter((program: any) => 
          program.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((program: any) => 
          categoryFilter === "all" || program.category === categoryFilter)
        .filter((program: any) => 
          statusFilter === "all" || 
          (statusFilter === "active" && program.active) || 
          (statusFilter === "inactive" && !program.active))
    : [];

  // Get unique categories for filter
  const categories = !isLoading && programs
    ? [...new Set(programs.map((program: any) => program.category))]
        .filter(Boolean)
        .sort()
    : [];

  // Count programs by status
  const activeProgramsCount = !isLoading && programs
    ? programs.filter((program: any) => program.active).length
    : 0;

  const inactiveProgramsCount = !isLoading && programs
    ? programs.filter((program: any) => !program.active).length
    : 0;

  // Handle program deletion
  const handleDeleteProgram = (id: number) => {
    if (window.confirm("Are you sure you want to delete this affiliate program?")) {
      deleteProgramMutation.mutate(id);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-primary-800">Affiliate Programs</h1>
          <p className="text-gray-600">Manage your affiliate program partnerships</p>
        </div>
        <Button className="mt-3 sm:mt-0" asChild>
          <a href="/affiliate-programs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Program
          </a>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>
          <Input
            placeholder="Search programs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">{programs?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">{activeProgramsCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive
            <Badge variant="secondary" className="ml-2">{inactiveProgramsCount}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Render skeletons while loading
              Array(6).fill(0).map((_, index) => (
                <ProgramCard key={index} loading={true} />
              ))
            ) : filteredPrograms.length > 0 ? (
              // Render actual program cards
              filteredPrograms.map((program: any) => (
                <ProgramCard 
                  key={program.id}
                  program={program}
                  onDelete={() => handleDeleteProgram(program.id)}
                />
              ))
            ) : (
              // No results found
              <div className="col-span-full text-center p-8">
                <div className="mx-auto mb-4 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">No programs found</h3>
                <p className="text-gray-500 mt-1">
                  Try adjusting your filters or add a new affiliate program
                </p>
                <Button className="mt-4" asChild>
                  <a href="/affiliate-programs/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Program
                  </a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* The same content is repeated for each tab, just with different filters applied */}
        <TabsContent value="active">
          {/* This is handled by the statusFilter state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Same content as "all" tab */}
          </div>
        </TabsContent>
        
        <TabsContent value="inactive">
          {/* This is handled by the statusFilter state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Same content as "all" tab */}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AffiliatePrograms;
