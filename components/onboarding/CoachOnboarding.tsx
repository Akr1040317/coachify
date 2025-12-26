"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardStepShell } from "@/components/ui/WizardStepShell";
import { GradientCard } from "@/components/ui/GradientCard";
import { SportIconCard } from "@/components/ui/SportIconCard";
import { InteractiveQuestion } from "@/components/ui/InteractiveQuestion";
import { SPORTS, SPORT_FOCUS_AREAS, type Sport } from "@/lib/constants/sports";
import { getCoachData, createCoachData, updateCoachData } from "@/lib/firebase/firestore";
import { updateUserData } from "@/lib/firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { checkStripeConnectStatus } from "@/lib/firebase/stripe-helpers";
import { getAuth } from "firebase/auth";

interface CoachOnboardingProps {
  currentStep: number;
  userId: string;
  isPreSignup?: boolean;
}

export function CoachOnboarding({ currentStep, userId, isPreSignup = false }: CoachOnboardingProps) {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    headline: "",
    profilePhoto: null as File | null,
    profilePhotoUrl: "",
    linkedin: "",
    youtube: "",
    instagram: "",
    sports: [] as string[],
    specialtiesBySport: {} as Record<string, string[]>,
    experienceType: "",
    credentials: "",
    teams: "",
    achievements: "",
    proofDocs: null as File | null,
    introVideo: null as File | null,
    introVideoUrl: "",
    bio: "",
    coachingPhilosophy: "",
    freeIntroEnabled: true,
    freeIntroMinutes: 15,
    price30Min: 0,
    price60Min: 0,
    weeklyRules: [] as Array<{ dayOfWeek: number; start: string; end: string }>,
  });

  const totalSteps = 6;

  useEffect(() => {
    // Reset question index when step changes
    console.log("🔄 Step changed to:", currentStep);
    console.log("Resetting question index to 0");
    setQuestionIndex(0);
  }, [currentStep]);

  useEffect(() => {
    console.log("📊 Component state update:", {
      currentStep,
      questionIndex,
      totalSteps,
      formData: {
        price30Min: formData.price30Min,
        price60Min: formData.price60Min,
        bio: formData.bio?.substring(0, 30),
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        sports: formData.sports.length,
        experienceType: formData.experienceType,
      },
    });
  }, [currentStep, questionIndex, formData.price30Min, formData.price60Min, formData.bio, formData.firstName, formData.lastName, formData.headline, formData.sports.length, formData.experienceType]);

  useEffect(() => {
    const loadData = async () => {
      const coachData = await getCoachData(userId);
      if (coachData) {
        // Split displayName into firstName and lastName
        const nameParts = (coachData.displayName || "").split(" ");
        setFormData({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          timezone: coachData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          headline: coachData.headline || "",
          profilePhoto: null,
          profilePhotoUrl: coachData.avatarUrl || "",
          linkedin: coachData.socialLinks?.linkedin || "",
          youtube: coachData.socialLinks?.youtube || "",
          instagram: coachData.socialLinks?.instagram || "",
          sports: coachData.sports || [],
          specialtiesBySport: coachData.specialtiesBySport || {},
          experienceType: coachData.experienceType || "",
          credentials: coachData.credentials?.join("\n") || "",
          teams: "",
          achievements: "",
          proofDocs: null,
          introVideo: null,
          introVideoUrl: coachData.introVideoUrl || "",
      bio: coachData.bio || "",
      coachingPhilosophy: (coachData as any).coachingPhilosophy || "",
          freeIntroEnabled: coachData.sessionOffers?.freeIntroEnabled ?? true,
          freeIntroMinutes: coachData.sessionOffers?.freeIntroMinutes || 15,
          price30Min: coachData.sessionOffers?.paid?.find(p => p.minutes === 30)?.priceCents ? coachData.sessionOffers.paid.find(p => p.minutes === 30)!.priceCents / 100 : 0,
          price60Min: coachData.sessionOffers?.paid?.find(p => p.minutes === 60)?.priceCents ? coachData.sessionOffers.paid.find(p => p.minutes === 60)!.priceCents / 100 : 0,
          weeklyRules: [],
        });
      }
    };
    loadData();
  }, [userId]);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    // Try using API route first (bypasses CORS issues)
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get ID token for authentication
      const idToken = await user.getIdToken();
      
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);

      // Upload via API route
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.downloadURL;
    } catch (apiError: any) {
      console.warn("API upload failed, trying direct Firebase Storage:", apiError);
      
      // Fallback to direct Firebase Storage upload (works if CORS is configured)
      if (!storage) {
        throw new Error("Storage is not initialized");
      }
      
      try {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      } catch (directError: any) {
        // If both fail, throw the API error as it's more likely to be the real issue
        throw new Error(`Upload failed: ${apiError.message || directError.message}`);
      }
    }
  };

  // Helper to convert file to base64 for storage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const saveData = async () => {
    console.log("💾 saveData called for step", currentStep);
    console.log("Form data snapshot:", {
      firstName: formData.firstName,
      lastName: formData.lastName,
      headline: formData.headline,
      sports: formData.sports,
      bio: formData.bio?.substring(0, 50),
      price30Min: formData.price30Min,
      price60Min: formData.price60Min,
      hasIntroVideo: !!formData.introVideo,
      introVideoUrl: formData.introVideoUrl,
    });

    let avatarUrl = formData.profilePhotoUrl;
    let introVideoUrl = formData.introVideoUrl;

    // Upload files if provided
    if (formData.introVideo && storage) {
      console.log("📹 Uploading intro video...");
      try {
        introVideoUrl = await uploadFile(formData.introVideo, `coaches/${userId}/intro-video`);
        console.log("✅ Intro video uploaded successfully:", introVideoUrl);
      } catch (error: any) {
        console.warn("⚠️ Failed to upload intro video:", error);
        console.warn("Error details:", {
          message: error.message,
          stack: error.stack,
        });
        // Keep existing URL if upload fails
      }
    }

    const coachData = {
      userId,
      displayName: `${formData.firstName} ${formData.lastName}`.trim(),
      headline: formData.headline,
      bio: formData.bio,
      timezone: formData.timezone,
      location: "", // Online coaching, no location needed
      sports: formData.sports,
      specialtiesBySport: formData.specialtiesBySport,
      experienceType: formData.experienceType,
      credentials: formData.credentials.split("\n").filter(c => c.trim()),
      socialLinks: Object.fromEntries(
        Object.entries({
          linkedin: formData.linkedin,
          youtube: formData.youtube,
          instagram: formData.instagram,
        }).filter(([_, value]) => value && value.trim() !== "")
      ),
      avatarUrl,
      introVideoUrl,
      introVideoThumbnailUrl: "", // TODO: Generate thumbnail
      coachingPhilosophy: formData.coachingPhilosophy,
      isVerified: false,
      status: "pending_verification" as const,
      sessionOffers: {
        freeIntroEnabled: formData.freeIntroEnabled,
        freeIntroMinutes: formData.freeIntroMinutes,
        paid: [
          { minutes: 30, priceCents: formData.price30Min * 100, currency: "USD" },
          { minutes: 60, priceCents: formData.price60Min * 100, currency: "USD" },
        ],
      },
      ratingAvg: 0,
      ratingCount: 0,
    };

    console.log("📝 Saving coach data...");
    console.log("Coach data to save:", {
      userId,
      displayName: coachData.displayName,
      headline: coachData.headline,
      sports: coachData.sports,
      hasBio: !!coachData.bio,
      hasIntroVideoUrl: !!coachData.introVideoUrl,
      sessionOffers: coachData.sessionOffers,
    });

    const existing = await getCoachData(userId);
    console.log("Existing coach data found:", !!existing);
    
    if (existing) {
      console.log("Updating existing coach data...");
      await updateCoachData(userId, coachData);
      console.log("✅ Coach data updated");
    } else {
      console.log("Creating new coach data...");
      await createCoachData(userId, coachData);
      console.log("✅ Coach data created");
    }
    
    console.log("💾 saveData completed");
  };

  // Get questions for current step
  const getStepQuestions = () => {
    switch (currentStep) {
      case 2:
        return [
          { key: "firstName", question: "What's your first name?", required: true },
          { key: "lastName", question: "What's your last name?", required: true },
          { key: "headline", question: "What's your professional headline?", description: "e.g., Former Pro Basketball Player", required: true },
        ];
      case 5:
        return [
          { key: "introVideo", question: "Upload an intro video (optional)", description: "Let students see your personality", required: false },
          { key: "bio", question: "Tell us about yourself", description: "Write a short bio that will help students get to know you", required: true },
          { key: "coachingPhilosophy", question: "What's your coaching philosophy?", description: "Share your approach to coaching", required: false },
        ];
      case 6:
        return [
          { key: "price30Min", question: "What's your price for a 30-minute session?", description: "Enter amount in USD", required: true },
          { key: "price60Min", question: "What's your price for a 60-minute session?", description: "Enter amount in USD", required: true },
          { key: "freeIntro", question: "Do you want to offer a free intro consultation?", description: "This helps students get to know you", required: false },
        ];
      default:
        return [];
    }
  };

  const stepQuestions = getStepQuestions();
  const currentQuestion = stepQuestions.length > 0 && questionIndex < stepQuestions.length 
    ? stepQuestions[questionIndex] 
    : undefined;
  const isLastQuestionInStep = stepQuestions.length > 0 && questionIndex === stepQuestions.length - 1;

  const handleNext = async () => {
    console.log("=== handleNext called ===");
    console.log("Current step:", currentStep);
    console.log("Total steps:", totalSteps);
    console.log("Question index:", questionIndex);
    console.log("Step questions length:", stepQuestions.length);
    console.log("Is last question in step:", isLastQuestionInStep);
    console.log("Form data:", {
      price30Min: formData.price30Min,
      price60Min: formData.price60Min,
      freeIntroEnabled: formData.freeIntroEnabled,
      bio: formData.bio?.substring(0, 50) + "...",
    });

    // If there are sub-questions in this step, handle them first
    if (stepQuestions.length > 0 && !isLastQuestionInStep) {
      console.log("Moving to next question in step", currentStep);
      setQuestionIndex(questionIndex + 1);
      return;
    }

    try {
      // Save data before navigation
      console.log("Attempting to save data for step", currentStep);
      try {
        await saveData();
        console.log("✅ Data saved successfully for step", currentStep);
      } catch (saveError: any) {
        console.error("❌ Error saving data:", saveError);
        console.error("Save error details:", {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
        });
        // For step 1, we can continue even if save fails
        if (currentStep > 1) {
          // Don't throw - allow navigation to continue
          console.warn("⚠️ Save failed but continuing navigation");
        }
      }
      
      // Reset question index for next step
      setQuestionIndex(0);
      
      // Navigate to next step
      if (currentStep < totalSteps) {
        const nextStep = currentStep + 1;
        console.log("➡️ Navigating to step", nextStep);
        console.log("Navigation path:", `/onboarding/coach/${nextStep}`);
        router.push(`/onboarding/coach/${nextStep}`);
      } else {
        // After last step (step 6), complete onboarding
        console.log("🎉 Onboarding complete! Current step is", currentStep, "of", totalSteps);
        console.log("Starting completion process...");
        
        try {
          console.log("Updating user data: setting onboardingCompleted = true");
          console.log("User ID:", userId);
          
          await updateUserData(userId, { onboardingCompleted: true });
          console.log("✅ User data updated successfully");
          
          // Check if Stripe Connect is set up
          console.log("Checking Stripe Connect status...");
          const stripeStatus = await checkStripeConnectStatus(userId);
          console.log("Stripe status:", stripeStatus);
          
          const canReceivePayments = stripeStatus.status === "active" && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled;
          console.log("Can receive payments:", canReceivePayments);
          
          if (!canReceivePayments) {
            // Redirect to payment setup page
            console.log("💳 Payment setup not complete, redirecting to Stripe onboarding");
            console.log("Redirect path: /app/coach/onboarding/stripe?from=onboarding");
            router.push("/app/coach/onboarding/stripe?from=onboarding");
          } else {
            // Redirect to dashboard
            console.log("✅ Payment setup complete, redirecting to dashboard");
            console.log("Redirect path: /app/coach/dashboard");
            router.push("/app/coach/dashboard");
          }
        } catch (updateError: any) {
          console.error("❌ Error updating user data:", updateError);
          console.error("Update error details:", {
            message: updateError.message,
            stack: updateError.stack,
            name: updateError.name,
          });
          
          // Check Stripe status even if update fails
          try {
            console.log("Attempting Stripe check after update error...");
            const stripeStatus = await checkStripeConnectStatus(userId);
            console.log("Stripe status (after error):", stripeStatus);
            
            const canReceivePayments = stripeStatus.status === "active" && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled;
            console.log("Can receive payments (after error):", canReceivePayments);
            
            if (!canReceivePayments) {
              console.log("Redirecting to Stripe onboarding (after error)");
              router.push("/app/coach/onboarding/stripe?from=onboarding");
            } else {
              console.log("Redirecting to dashboard (after error)");
              router.push("/app/coach/dashboard");
            }
          } catch (stripeError: any) {
            console.error("❌ Stripe check failed:", stripeError);
            console.error("Stripe error details:", {
              message: stripeError.message,
              stack: stripeError.stack,
              name: stripeError.name,
            });
            // Fallback to dashboard if Stripe check fails
            console.log("⚠️ Fallback: Redirecting to dashboard");
            router.push("/app/coach/dashboard");
          }
        }
      }
    } catch (error: any) {
      console.error("❌❌❌ Fatal error in handleNext:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        currentStep,
        totalSteps,
        questionIndex,
      });
      // Show user-friendly error message
      alert(`There was an error: ${error.message || "Unknown error"}. Please check the console for details.`);
    }
    
    console.log("=== handleNext completed ===");
  };

  const handleBack = () => {
    // If there are sub-questions and we're not on the first one, go back
    if (stepQuestions.length > 0 && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      return;
    }
    
    if (currentStep > 1) {
      setQuestionIndex(0);
      router.push(`/onboarding/coach/${currentStep - 1}`);
    }
  };

  const canGoNext = () => {
    console.log("🔍 canGoNext check:", {
      currentStep,
      questionIndex,
      currentQuestionKey: currentQuestion?.key,
      currentQuestionRequired: currentQuestion?.required,
    });

    // Check if current question is answered
    if (currentQuestion) {
      if (currentQuestion.required) {
        let canProceed = false;
        switch (currentQuestion.key) {
          case "firstName":
            canProceed = formData.firstName.trim() !== "";
            break;
          case "lastName":
            canProceed = formData.lastName.trim() !== "";
            break;
          case "headline":
            canProceed = formData.headline.trim() !== "";
            break;
          case "introVideo":
          case "coachingPhilosophy":
          case "freeIntro":
            canProceed = true; // Optional
            break;
          case "bio":
            canProceed = formData.bio.trim() !== "";
            break;
          case "price30Min":
            canProceed = formData.price30Min > 0;
            break;
          case "price60Min":
            canProceed = formData.price60Min > 0;
            break;
          default:
            canProceed = true;
        }
        console.log(`canGoNext result for ${currentQuestion.key}:`, canProceed);
        return canProceed;
      }
      return true;
    }

    // Fallback to original logic
    let canProceed = false;
    switch (currentStep) {
      case 1:
        canProceed = true;
        break;
      case 2:
        canProceed = formData.firstName !== "" && formData.lastName !== "" && formData.headline !== "";
        break;
      case 3:
        canProceed = formData.sports.length > 0;
        break;
      case 4:
        canProceed = formData.experienceType !== "";
        break;
      case 5:
        canProceed = formData.bio !== "";
        break;
      case 6:
        canProceed = formData.price30Min > 0 && formData.price60Min > 0;
        console.log("Step 6 canGoNext check:", {
          price30Min: formData.price30Min,
          price60Min: formData.price60Min,
          canProceed,
        });
        break;
      default:
        canProceed = false;
    }
    console.log(`canGoNext result for step ${currentStep}:`, canProceed);
    return canProceed;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <GradientCard>
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Welcome, Coach!</h2>
              <p className="text-gray-400 text-xl md:text-2xl mb-6">
                Let&apos;s set up your coach profile. This will help students discover you and understand your expertise.
              </p>
            </div>
          </GradientCard>
        );

      case 2:
        if (!currentQuestion) {
          return null;
        }

        const renderQuestionContent = () => {
          switch (currentQuestion.key) {
            case "firstName":
              return (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white text-2xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your first name"
                  autoFocus
                />
              );
            case "lastName":
              return (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white text-2xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your last name"
                  autoFocus
                />
              );
            case "headline":
              return (
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full px-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white text-2xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder={currentQuestion.description || "e.g., Former Pro Basketball Player"}
                  autoFocus
                />
              );
            default:
              return null;
          }
        };

        return (
          <InteractiveQuestion
            question={currentQuestion.question}
            description={currentQuestion.description}
            onNext={handleNext}
            onBack={handleBack}
            canProceed={canGoNext()}
            showBack={questionIndex > 0 || currentStep > 1}
          >
            {renderQuestionContent()}
          </InteractiveQuestion>
        );

      case 3:
        return (
          <GradientCard>
            <div className="text-center mb-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Sports You Coach</h2>
              <p className="text-gray-400 text-lg mb-2">Select all sports you coach</p>
              <p className="text-gray-500 text-sm mb-4">Click on each sport to select or deselect. You can choose multiple sports.</p>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mb-4 max-h-[400px] overflow-y-auto">
              {SPORTS.map((sport) => (
                <SportIconCard
                  key={sport}
                  sport={sport}
                  selected={formData.sports.includes(sport)}
                  onClick={() => {
                    const newSports = formData.sports.includes(sport)
                      ? formData.sports.filter((s) => s !== sport)
                      : [...formData.sports, sport];
                    setFormData({ ...formData, sports: newSports });
                  }}
                />
              ))}
            </div>
            {formData.sports.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="font-semibold text-lg mb-3">Select specialties for each sport (optional)</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                {formData.sports.map((sport) => {
                  const focusAreas = SPORT_FOCUS_AREAS[sport as Sport] || [];
                  const selected = formData.specialtiesBySport[sport] || [];
                  return (
                    <div key={sport} className="p-3 bg-[var(--card)] rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">{sport}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {focusAreas.map((area) => (
                          <button
                            key={area}
                            onClick={() => {
                              const newSpecialties = selected.includes(area)
                                ? selected.filter((a) => a !== area)
                                : [...selected, area];
                              setFormData({
                                ...formData,
                                specialtiesBySport: {
                                  ...formData.specialtiesBySport,
                                  [sport]: newSpecialties,
                                },
                              });
                            }}
                            className={`
                              px-2 py-1 rounded-full text-xs transition-all
                              ${selected.includes(area)
                                ? "bg-blue-500 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              }
                            `}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </GradientCard>
        );

      case 4:
        return (
          <GradientCard>
            <div className="text-center mb-8">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Experience and Credentials</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <select
                  value={formData.experienceType}
                  onChange={(e) => setFormData({ ...formData, experienceType: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select...</option>
                  <option value="Former professional">Former professional</option>
                  <option value="Former collegiate">Former collegiate</option>
                  <option value="Former academy">Former academy</option>
                  <option value="Certified coach">Certified coach</option>
                  <option value="Competitive player">Competitive player</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Credentials</label>
                <textarea
                  value={formData.credentials}
                  onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                  placeholder="List your certifications, teams, leagues, achievements (one per line)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Proof Documents (optional)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, proofDocs: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
          </GradientCard>
        );

      case 5:
        if (!currentQuestion) {
          return null;
        }

        const renderStep5Content = () => {
          switch (currentQuestion.key) {
            case "introVideo":
              return (
                <div className="w-full">
                  <label className="block w-full px-8 py-12 bg-[var(--card)] border-2 border-dashed border-gray-600 rounded-xl text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFormData({ ...formData, introVideo: e.target.files?.[0] || null })}
                      className="hidden"
                    />
                    <div className="text-gray-400">
                      {formData.introVideo ? (
                        <span className="text-blue-400">✓ Video selected: {formData.introVideo.name}</span>
                      ) : (
                        <>
                          <span className="text-6xl block mb-4">🎥</span>
                          <span>Click to upload intro video</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              );
            case "bio":
              return (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white min-h-[200px] text-xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Tell students about yourself, your background, and what makes you a great coach..."
                  autoFocus
                />
              );
            case "coachingPhilosophy":
              return (
                <textarea
                  value={formData.coachingPhilosophy}
                  onChange={(e) => setFormData({ ...formData, coachingPhilosophy: e.target.value })}
                  className="w-full px-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white min-h-[200px] text-xl focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="What's your approach to coaching? How do you help students improve?"
                  autoFocus
                />
              );
            default:
              return null;
          }
        };

        return (
          <InteractiveQuestion
            question={currentQuestion.question}
            description={currentQuestion.description}
            onNext={handleNext}
            onBack={handleBack}
            canProceed={canGoNext()}
            showBack={questionIndex > 0 || currentStep > 1}
          >
            {renderStep5Content()}
          </InteractiveQuestion>
        );

      case 6:
        if (!currentQuestion) {
          return null;
        }

        const renderStep6Content = () => {
          switch (currentQuestion.key) {
            case "freeIntro":
              return (
                <div className="space-y-4">
                  <button
                    onClick={() => setFormData({ ...formData, freeIntroEnabled: !formData.freeIntroEnabled })}
                    className={`
                      w-full p-6 rounded-xl border-2 text-left transition-all
                      ${formData.freeIntroEnabled
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-600 hover:border-gray-500"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded border-2 flex items-center justify-center
                        ${formData.freeIntroEnabled ? "border-blue-500 bg-blue-500" : "border-gray-500"}
                      `}>
                        {formData.freeIntroEnabled && <span className="text-white text-lg">✓</span>}
                      </div>
                      <span className="text-2xl font-medium">Yes, offer free intro consultation</span>
                    </div>
                  </button>
                  {formData.freeIntroEnabled && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2 text-gray-400">Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={formData.freeIntroMinutes}
                        onChange={(e) => setFormData({ ...formData, freeIntroMinutes: parseInt(e.target.value) || 15 })}
                        className="w-full px-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white text-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            case "price30Min":
              return (
                <div>
                  <div className="relative">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.price30Min || ""}
                      onChange={(e) => setFormData({ ...formData, price30Min: parseInt(e.target.value) || 0 })}
                      className="w-full pl-12 pr-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white text-2xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>
              );
            case "price60Min":
              return (
                <div>
                  <div className="relative">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.price60Min || ""}
                      onChange={(e) => setFormData({ ...formData, price60Min: parseInt(e.target.value) || 0 })}
                      className="w-full pl-12 pr-8 py-6 bg-[var(--card)] border-2 border-gray-600 rounded-xl text-white text-2xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>
              );
            default:
              return null;
          }
        };

        return (
          <InteractiveQuestion
            question={currentQuestion.question}
            description={currentQuestion.description}
            onNext={handleNext}
            onBack={handleBack}
            canProceed={canGoNext()}
            showBack={questionIndex > 0 || currentStep > 1}
          >
            {renderStep6Content()}
          </InteractiveQuestion>
        );

      default:
        return null;
    }
  };

  // If we're using interactive questions, don't show WizardStepShell navigation
  const hasSubQuestions = stepQuestions.length > 0;
  
  return (
    <WizardStepShell
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={hasSubQuestions ? undefined : handleBack}
      onNext={hasSubQuestions ? undefined : handleNext}
      canGoNext={hasSubQuestions ? undefined : canGoNext()}
    >
      {renderStep()}
    </WizardStepShell>
  );
}


