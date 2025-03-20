import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { createAffiliateProgram, updateAffiliateProgram } from "@/lib/api";

// Schema for program validation
const programSchema = z.object({
  name: z.string().min(2, { message: "Program name must be at least 2 characters" }),
  description: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL" }).or(z.literal("")),
  commissionRate: z
    .number({ invalid_type_error: "Please enter a valid commission rate" })
    .min(0, { message: "Commission rate must be positive" })
    .max(100, { message: "Commission rate cannot exceed 100%" })
    .optional(),
  commissionType: z.string().optional(),
  payoutThreshold: z
    .number({ invalid_type_error: "Please enter a valid payout threshold" })
    .min(0, { message: "Payout threshold must be positive" })
    .optional(),
  payoutFrequency: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().default(true),
});

type ProgramFormValues = z.infer<typeof programSchema>;

interface ProgramFormProps {
  programId?: string;
}

const ProgramForm = ({ programId }: ProgramFormProps) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch program data if editing
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['/api/affiliate-programs', programId],
    enabled: !!programId,
  });

  // Category options
  const categoryOptions = [
    "SaaS",
    "Finance",
    "E-learning",
    "E-commerce",
    "Web Hosting",
    "Marketing",
    "Software",
    "Travel",
    "Fashion",
    "Health & Fitness",
    "Other"
  ];

  // Commission type options
  const commissionTypeOptions = [
    "percentage",
    "fixed amount",
    "tiered"
  ];

  // Payout frequency options
  const payoutFrequencyOptions = [
    "weekly",
    "bi-weekly",
    "monthly",
    "quarterly"
  ];

  // Set up form
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      commissionRate: 0,
      commissionType: "percentage",
      payoutThreshold: 0,
      payoutFrequency: "monthly",
      category: "SaaS",
      active: true,
    },
  });

  // Fill form with program data when editing
  useEffect(() => {
    if (program && !programLoading) {
      form.reset({
        name: program.name,
        description: program.description || "",
        website: program.website || "",
        commissionRate: program.commissionRate || 0,
        commissionType: program.commissionType || "percentage",
        payoutThreshold: program.payoutThreshold || 0,
        payoutFrequency: program.payoutFrequency || "monthly",
        category: program.category || "SaaS",
        active: program.active ?? true,
      });
    }
  }, [program, programLoading, form]);

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: createAffiliateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate-programs'] });
      toast({
        title: "Program Created",
        description: "The affiliate program has been successfully created.",
      });
      navigate("/affiliate-programs");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error creating the program.",
        variant: "destructive",
      });
    }
  });

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateAffiliateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate-programs'] });
      toast({
        title: "Program Updated",
        description: "The affiliate program has been successfully updated.",
      });
      navigate("/affiliate-programs");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error updating the program.",
        variant: "destructive",
      });
    }
  });

  // Form submission
  const onSubmit = (data: ProgramFormValues) => {
    // Convert string numbers to actual numbers
    const formattedData = {
      ...data,
      commissionRate: typeof data.commissionRate === 'string' 
        ? parseFloat(data.commissionRate) 
        : data.commissionRate,
      payoutThreshold: typeof data.payoutThreshold === 'string' 
        ? parseFloat(data.payoutThreshold) 
        : data.payoutThreshold,
    };
    
    if (programId) {
      updateProgramMutation.mutate({ id: parseInt(programId), data: formattedData });
    } else {
      createProgramMutation.mutate(formattedData);
    }
  };

  // Loading state
  const isLoading = programLoading || 
    createProgramMutation.isPending || 
    updateProgramMutation.isPending;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/affiliate-programs")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>
            {programId ? "Edit Affiliate Program" : "Add New Affiliate Program"}
          </CardTitle>
        </div>
      </CardHeader>
      
      {programLoading ? (
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter affiliate program name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter program description" 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter rate" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("commissionType") === "percentage" ? "%" : "$"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="commissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Type</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select commission type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commissionTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payoutThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Threshold ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter threshold" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payoutFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Frequency</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {payoutFrequencyOptions.map((frequency) => (
                            <SelectItem key={frequency} value={frequency}>
                              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this affiliate program
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate("/affiliate-programs")}
                disabled={isLoading}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading 
                  ? "Saving..." 
                  : programId 
                    ? "Update Program" 
                    : "Create Program"
                }
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
};

export default ProgramForm;
