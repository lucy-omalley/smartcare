import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Thank You!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your submission has been received successfully.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              We appreciate your time and will get back to you soon.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/">
                Return Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Register Another
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 