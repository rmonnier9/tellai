"use client";

import { useEffect, useState } from "react";
import { submitWaitlist } from "../lib/actions";
import {
  getUTMParametersWithFallback,
  storeUTMParameters,
  UTMParameters,
} from "../utils/utm";

export default function WaitlistForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [utmParams, setUtmParams] = useState<UTMParameters>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Capture UTM parameters on component mount
  useEffect(() => {
    const utmData = getUTMParametersWithFallback();
    setUtmParams(utmData);

    // Store UTM parameters for persistence across page navigation
    if (Object.keys(utmData).length > 0) {
      storeUTMParameters(utmData);
    }
  }, []);

  return (
    <div className="w-full max-w-md">
      <form
        className="flex flex-col sm:flex-row gap-3 w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          if (email.length === 0) {
            setMessage({
              type: "error",
              text: "Please enter your email address",
            });
            return;
          }
          try {
            setIsLoading(true);

            const result = await submitWaitlist(email, utmParams);

            if (result.success) {
              setMessage({
                type: "success",
                text: result.message || "Successfully joined the waitlist!",
              });
              setEmail("");
            } else {
              setMessage({
                type: "error",
                text: result.error || "Something went wrong. Please try again.",
              });
            }
          } catch (error) {
            console.error(error);
            setMessage({
              type: "error",
              text: "Something went wrong. Please try again.",
            });
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <input
          name="email"
          className="bg-white text-base px-4 py-3 rounded-lg flex-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="cursor-pointer px-6 py-3 bg-pink-400 hover:bg-pink-500 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Joining..." : "Get Early Access"}{" "}
          <span className="ml-1 tracking-normal text-pink-300 transition-transform group-hover:translate-x-0.5">
            -&gt;
          </span>
        </button>
      </form>
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
