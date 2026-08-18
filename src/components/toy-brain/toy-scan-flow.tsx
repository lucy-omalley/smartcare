"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import type { ToyBrainFeatures } from "@/types/toy-brain";
import { TOY_CATEGORY_OPTIONS } from "@/lib/toy-brain/constants";
import type { ToyCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { compressImageForUpload } from "@/lib/client/compress-image";
import { parseApiJson } from "@/lib/parse-api-json";

interface ToyScanFlowProps {
  features: ToyBrainFeatures;
}

export function ToyScanFlow({ features }: ToyScanFlowProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState<ToyCategory>("UNKNOWN");
  const [preview, setPreview] = useState<string | null>(null);

  const uploadPhoto = async (file: File) => {
    if (!features.unlimitedScans && (features.scansRemaining ?? 0) <= 0) {
      toast.error("No scans remaining this month. Upgrade to Premium for unlimited scans.");
      return;
    }

    setLoading(true);
    try {
      const { dataUrl, mimeType } = await compressImageForUpload(file);
      setPreview(dataUrl);

      const res = await fetch("/api/toy-brain/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoData: dataUrl,
          mimeType,
          useAi: features.aiPersonalization,
        }),
      });
      const data = await parseApiJson<{ toy?: { id: string; name: string }; error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Scan failed");

      toast.success(`We think this is ${data.toy!.name}!`);
      router.push(`/toy-brain/${data.toy!.id}?confirm=1`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not scan toy");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
  };

  const submitManual = async () => {
    if (!manualName.trim()) {
      toast.error("Enter a toy name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/toy-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName.trim(),
          category: manualCategory,
          useAi: features.aiPersonalization,
        }),
      });
      const data = await parseApiJson<{ toy?: { id: string }; error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not add toy");
      toast.success("Play ideas ready!");
      router.push(`/toy-brain/${data.toy!.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add toy");
    } finally {
      setLoading(false);
    }
  };

  if (manualMode) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Toy name</Label>
          <Input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g. LEGO DUPLO train"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {TOY_CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setManualCategory(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs border",
                  manualCategory === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
        <Button className="rounded-xl w-full" disabled={loading} onClick={submitManual}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Get play ideas
        </Button>
        <Button variant="ghost" className="w-full rounded-xl" onClick={() => setManualMode(false)}>
          Back to photo scan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="rounded-2xl overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Toy preview" className="w-full max-h-64 object-cover" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <Button
        className="rounded-xl h-12 w-full"
        disabled={loading}
        onClick={() => cameraInputRef.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
        Take photo
      </Button>

      <Button
        variant="outline"
        className="rounded-xl h-12 w-full"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" /> Upload photo
      </Button>

      <Button variant="ghost" className="rounded-xl w-full text-sm" onClick={() => setManualMode(true)}>
        <Search className="h-4 w-4 mr-2" /> Search manually
      </Button>

      {!features.isPremium && features.scansRemaining !== null && (
        <p className="text-xs text-center text-muted-foreground">
          {features.scansRemaining} free scan{features.scansRemaining === 1 ? "" : "s"} left this month
        </p>
      )}
    </div>
  );
}
