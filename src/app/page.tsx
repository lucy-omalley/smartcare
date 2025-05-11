import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to MumBot SmartCare</h1>
      <p className="text-xl text-muted-foreground text-center max-w-2xl">
        Europe's first AI-driven childcare matching platform connecting parents with both formal childcare facilities and temporary caregivers.
      </p>
    </main>
  );
}
