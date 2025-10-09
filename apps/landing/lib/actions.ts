"use server";

import { UTMParameters } from "../utils/utm";
import { handleWaitlistUser } from "./crisp";
import { supabase } from "./supabase";

export async function submitWaitlist(
  email: string,
  utmParams: UTMParameters = {}
) {
  try {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address" };
    }

    // Prepare data for insertion
    const waitlistData = {
      email,
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_term: utmParams.utm_term || null,
      utm_content: utmParams.utm_content || null,
      utm_id: utmParams.utm_id || null,
      created_at: new Date().toISOString(),
    };

    // Insert email and UTM data into Supabase
    const { error } = await supabase.from("waitlist").insert([waitlistData]);

    if (error) {
      // Handle duplicate email error
      if (error.code === "23505") {
        return {
          success: false,
          error: "This email is already on the waitlist",
        };
      }
      throw error;
    }

    // Créer le profil Crisp et déclencher l'événement
    const crispResult = await handleWaitlistUser(email);

    if (!crispResult.success) {
      // Log l'erreur mais ne pas faire échouer l'inscription à la waitlist
      console.error("Crisp integration failed:", crispResult.error);
    }

    return { success: true, message: "Successfully joined the waitlist!" };
  } catch (error) {
    console.error("Error submitting waitlist:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
