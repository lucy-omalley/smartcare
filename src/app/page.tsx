import { Bot, Clock, Heart, MapPin, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeNav } from "@/components/nav/home-nav";
import Link from 'next/link';

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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Find the Perfect Childcare Solution
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  SmartCare helps you find and connect with trusted childcare providers in your area. Start your search today!
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/auth/signin">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/providers">
                  <Button variant="outline" size="lg">Browse Providers</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Why Choose SmartCare?
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Our platform combines cutting-edge technology with human expertise to make finding childcare easier than ever.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="mb-2">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
