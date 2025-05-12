import { ChatInterface } from "@/components/chat/chat-interface";
import { Bot, Clock, Heart, MapPin, Shield, Users } from "lucide-react";
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
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                Find Care
              </button>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-lg bg-white shadow-sm border border-neutral-200">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
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
            <ChatInterface />
          </div>
        </div>
      </section>
    </main>
  );
}
