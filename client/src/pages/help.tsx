import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { HelpCircle, Mail, MessageSquare, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";

export default function Help() {
  const faqs = [
    {
      question: "How do I connect my Reddit account?",
      answer: "Navigate to Settings and click on the 'Connect Reddit Account' button. You'll be directed to Reddit's authorization page where you can grant permission for the app to post on your behalf."
    },
    {
      question: "How does the AI content generation work?",
      answer: "Our AI analyzes the affiliate product, target subreddit rules, and trending topics to generate content that's engaging, compliant, and optimized for conversions. You can edit and approve all content before posting."
    },
    {
      question: "What metrics are tracked for each campaign?",
      answer: "We track clicks, conversions, revenue, ROI, engagement rates, and audience demographics. All metrics are available in real-time on your Analytics dashboard."
    },
    {
      question: "How do I schedule posts across different time zones?",
      answer: "The scheduling system automatically optimizes posting times based on target subreddit activity. You can also manually select specific times in your preferred time zone from the Scheduling page."
    },
    {
      question: "Is there a limit to how many campaigns I can run?",
      answer: "The number of campaigns you can run depends on your subscription plan. Check your account settings for your current limits and usage."
    }
  ];

  const resources = [
    { 
      title: "Getting Started Guide", 
      description: "Learn the basics of setting up your first campaign", 
      icon: <BookOpen className="h-5 w-5" />,
      url: "#" 
    },
    { 
      title: "Content Best Practices", 
      description: "Tips for creating high-converting affiliate content", 
      icon: <FileText className="h-5 w-5" />,
      url: "#" 
    },
    { 
      title: "API Documentation", 
      description: "Technical documentation for developers", 
      icon: <FileText className="h-5 w-5" />,
      url: "#" 
    }
  ];

  return (
    <PageWrapper
      title="Help & Support"
      description="Find answers and get assistance with your marketing automation"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary-500" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions about using our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Need help? Our support team is ready to assist you
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <a 
              href="#" 
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full flex items-center justify-center gap-2"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Start a Chat
            </a>
            <a 
              href="mailto:support@example.com" 
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full flex items-center justify-center gap-2"
              )}
            >
              <Mail className="h-4 w-4" />
              support@example.com
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((resource, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {resource.icon}
                  {resource.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {resource.description}
                </p>
                <a 
                  href={resource.url} 
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "p-0 h-auto text-primary-500"
                  )}
                >
                  Read More →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}