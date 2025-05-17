"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AvailabilityCalendar } from "@/components/forms/availability-calendar";
import { CrecheCapacity } from "@/components/forms/creche-capacity";
import { DUBLIN_LOCATIONS } from '@/lib/constants';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  type: z.enum(["creche", "childminder"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  experience: z.string().min(1, "Please select your experience level"),
  hourlyRate: z.string().min(1, "Please enter your hourly rate"),
  availability: z.record(z.string(), z.array(z.object({
    startTime: z.string(),
    endTime: z.string()
  }))),
  crecheCapacity: z.array(z.object({
    minAge: z.number(),
    maxAge: z.number(),
    capacity: z.number()
  })).optional()
});

type FormData = z.infer<typeof formSchema>;

export function ProviderRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"creche" | "childminder">("childminder");
  const [selectedLocation, setSelectedLocation] = useState<typeof DUBLIN_LOCATIONS[0] | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      type: "childminder",
      address: "",
      location: DUBLIN_LOCATIONS[0],
      description: "",
      experience: "",
      hourlyRate: "",
      availability: {},
      crecheCapacity: []
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Something went wrong");
      }

      toast.success("Registration submitted successfully!");
      router.push("/thank-you");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailabilityChange = (newAvailability: Record<string, { startTime: string; endTime: string; }[]>) => {
    form.setValue("availability", newAvailability, { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter your full name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter your email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              placeholder="Enter your phone number"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Provider Type</Label>
            <Select
              onValueChange={(value: "creche" | "childminder") => {
                setSelectedType(value);
                form.setValue("type", value);
              }}
              defaultValue={form.getValues("type")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="childminder">Childminder</SelectItem>
                <SelectItem value="creche">Creche</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select
            onValueChange={(value) => {
              const location = DUBLIN_LOCATIONS.find(loc => loc.name === value);
              if (location) {
                setSelectedLocation(location);
                form.setValue("location", location);
                form.setValue("address", `${location.name}, Dublin`);
              }
            }}
            defaultValue={form.getValues("location")?.name}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your location" />
            </SelectTrigger>
            <SelectContent>
              {DUBLIN_LOCATIONS.map((location) => (
                <SelectItem key={location.name} value={location.name}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.location && (
            <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...form.register("address")}
            placeholder="Enter your address"
          />
          {form.formState.errors.address && (
            <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Tell us about your experience and approach to childcare"
            rows={4}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Select
              onValueChange={(value) => form.setValue("experience", value)}
              defaultValue={form.getValues("experience")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select years of experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1">0-1 years</SelectItem>
                <SelectItem value="1-3">1-3 years</SelectItem>
                <SelectItem value="3-5">3-5 years</SelectItem>
                <SelectItem value="5+">5+ years</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.experience && (
              <p className="text-sm text-red-500">{form.formState.errors.experience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              {...form.register("hourlyRate")}
              placeholder="Enter your hourly rate"
            />
            {form.formState.errors.hourlyRate && (
              <p className="text-sm text-red-500">{form.formState.errors.hourlyRate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Availability</Label>
          <AvailabilityCalendar
            value={form.watch("availability")}
            onChange={handleAvailabilityChange}
          />
          {form.formState.errors.availability && (
            <p className="text-sm text-red-500">
              {typeof form.formState.errors.availability === 'string' 
                ? form.formState.errors.availability 
                : 'Please set your availability'}
            </p>
          )}
        </div>

        {selectedType === "creche" && (
          <div className="space-y-4">
            <Label>Creche Capacity</Label>
            <CrecheCapacity
              value={form.watch("crecheCapacity") || []}
              onChange={(value) => form.setValue("crecheCapacity", value)}
            />
            {form.formState.errors.crecheCapacity && (
              <p className="text-sm text-red-500">{form.formState.errors.crecheCapacity.message}</p>
            )}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Register as Provider"}
      </Button>
    </form>
  );
} 