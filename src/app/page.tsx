'use client';

import { Bot, Clock, Heart, MapPin, Shield, Users, ArrowRight, Star, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeNav } from "@/components/nav/home-nav";
import Link from 'next/link';
import { useSession } from "next-auth/react";

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

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Working Mother",
    content: "SmartCare helped me find a reliable childcare provider within hours. The AI matching system is incredible!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Father of Two",
    content: "As a busy parent, I appreciate how easy it is to find and book childcare services. The platform is intuitive and efficient.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Childcare Provider",
    content: "Joining SmartCare has helped me connect with more families and grow my business. The support team is amazing!",
    rating: 5
  }
];

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background -z-10" />
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
                  Trusted by 1000+ families in Ireland
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/80">
                    Find the Perfect Childcare Solution
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
                  SmartCare helps you find and connect with trusted childcare providers in your area. Start your search today!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="group bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin">
                    <Button size="lg" className="group bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
                <Link href="/chat">
                  <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                    <MessageSquare className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    Try MumBot
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Verified Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Why Choose SmartCare?
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform combines cutting-edge technology with human expertise to make finding childcare easier than ever.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/20">
                  <CardHeader>
                    <div className="mb-2 p-2 w-fit rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  What Our Users Say
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Join thousands of satisfied parents and childcare providers who trust SmartCare
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Find Your Perfect Match?
                </h2>
                <p className="mx-auto max-w-[700px] text-primary-foreground/90 md:text-xl">
                  Join thousands of families who trust SmartCare for their childcare needs
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <Link href="/dashboard">
                    <Button size="lg" variant="secondary" className="group bg-white hover:bg-white/90 text-primary shadow-lg hover:shadow-xl transition-all">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin">
                    <Button size="lg" variant="secondary" className="group bg-white hover:bg-white/90 text-primary shadow-lg hover:shadow-xl transition-all">
                      Get Started Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
