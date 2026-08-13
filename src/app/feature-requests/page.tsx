"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Lightbulb } from "lucide-react";

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "PLANNED" | "IN_PROGRESS" | "RELEASED";
  voteCount: number;
};

const STATUS_LABEL: Record<FeatureRequest["status"], string> = {
  OPEN: "Open",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  RELEASED: "Released",
};

export default function FeatureRequestsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/feature-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []));
  }, []);

  async function submitIdea() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error("Failed");
      setTitle("");
      setDescription("");
      const list = await fetch("/api/feature-requests").then((r) => r.json());
      setRequests(list.requests ?? []);
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(id: string) {
    await fetch(`/api/feature-requests/${id}/vote`, { method: "POST" });
    const list = await fetch("/api/feature-requests").then((r) => r.json());
    setRequests(list.requests ?? []);
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-12">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggest a Feature
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vote on ideas and tell us what would make Parenfy indispensable.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Submit an idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Feature title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Why would this help your family?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="w-full rounded-xl"
              disabled={submitting || title.length < 4 || description.length < 10}
              onClick={submitIdea}
            >
              Submit idea
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id} className="rounded-2xl">
              <CardContent className="p-4 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl shrink-0 flex flex-col h-auto py-2 px-3"
                  onClick={() => vote(req.id)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs font-medium">{req.voteCount}</span>
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{req.title}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {STATUS_LABEL[req.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{req.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
