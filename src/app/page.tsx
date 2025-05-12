import { ChatInterface } from "@/components/chat/chat-interface";
import { Bot, Clock, Heart, MapPin, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeNav } from "@/components/nav/home-nav";

const features = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: "AI-Powered Matching",
    description: "Find the perfect childcare match within 30 seconds using our advanced AI system."
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Real-Time Availability",
    description: "Access up-to-the-minute availability for both formal childcare and temporary caregivers."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Verified Providers",
    description: "All childcare providers are thoroughly vetted and verified for your peace of mind."
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Location-Based Search",
    description: "Find childcare options near you with our interactive map interface."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Multi-Language Support",
    description: "Get assistance in multiple languages, perfect for immigrant families."
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Personalized Care",
    description: "Tailored childcare solutions based on your family's specific needs."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HomeNav />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="text-primary">MumBot SmartCare</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Europe's first AI-driven childcare matching platform connecting parents with both formal childcare facilities and temporary caregivers.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg">Get Started</Button>
              <Button size="lg" variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="mb-2 text-primary">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Interface Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Try MumBot Now</h2>
              <p className="text-muted-foreground">
                Start a conversation with our AI assistant to find the perfect childcare solution for your family.
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <ChatInterface />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
