"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardStepShell } from "@/components/ui/WizardStepShell";
import { GradientCard } from "@/components/ui/GradientCard";
import { SportIconCard } from "@/components/ui/SportIconCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SPORTS, SPORT_FOCUS_AREAS, SKILL_LEVELS, SKILL_LEVEL_DESCRIPTIONS, STUDENT_GOALS, type Sport, type SkillLevel, type StudentGoal } from "@/lib/constants/sports";
import { getStudentData, createStudentData, updateStudentData } from "@/lib/firebase/firestore";
import { updateUserData } from "@/lib/firebase/firestore";

interface StudentOnboardingProps {
  currentStep: number;
  userId: string;
  isPreSignup?: boolean;
}

export function StudentOnboarding({ currentStep, userId, isPreSignup = false }: StudentOnboardingProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    age: 0,
    guardianName: "",
    guardianEmail: "",
    guardianConsent: false,
    sports: [] as string[],
    primarySport: "",
    level: "",
    yearsExperience: "",
    goals: [] as string[],
    successIn3Months: "",
    focusAreas: [] as string[],
    coachingStyle: [] as string[],
    sessionLength: [] as number[],
    budgetMin: 0,
    budgetMax: 100,
    availability: [] as string[],
    language: "",
  });

  const totalSteps = 7; // Reduced from 8 - removed preferences step

  useEffect(() => {
    // Load existing data
    const loadData = async () => {
      const studentData = await getStudentData(userId);
      if (studentData) {
        setFormData({
          age: studentData.age || 0,
          guardianName: "",
          guardianEmail: "",
          guardianConsent: false,
          sports: studentData.sports || [],
          primarySport: studentData.primarySport || "",
          level: studentData.level || "",
          yearsExperience: studentData.yearsExperience?.toString() || "",
          goals: studentData.goals || [],
          successIn3Months: studentData.successIn3Months || "",
          focusAreas: studentData.focusAreas || [],
          // Removed preferences fields - no longer used
          coachingStyle: [],
          sessionLength: [],
          budgetMin: 0,
          budgetMax: 100,
          availability: [],
          language: "",
        });
      }
    };
    loadData();
  }, [userId]);

  const saveData = async () => {
    // Build student data object, filtering out undefined values
    const studentData: any = {
      age: formData.age,
      sports: formData.sports,
      primarySport: formData.primarySport || null,
      level: formData.level || null,
      goals: formData.goals,
      successIn3Months: formData.successIn3Months || null,
      focusAreas: formData.focusAreas,
      // Removed preferences - no longer collecting coaching style, session length, budget, or availability
    };

    // Only add yearsExperience if it has a value
    if (formData.yearsExperience && formData.yearsExperience.trim() !== "") {
      const parsed = parseInt(formData.yearsExperience);
      if (!isNaN(parsed)) {
        studentData.yearsExperience = parsed;
      }
    }

    // Only add language if it has a value
    if (formData.language && formData.language.trim() !== "") {
      studentData.preferences.language = formData.language;
    }

    // Filter out undefined values recursively
    const cleanData = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      if (Array.isArray(obj)) {
        return obj.map(cleanData);
      }
      if (typeof obj === "object") {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = cleanData(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    const cleanedStudentData = cleanData(studentData);

    // Always save to Firestore (user is authenticated)
    const existing = await getStudentData(userId);
    if (existing) {
      await updateStudentData(userId, cleanedStudentData);
    } else {
      await createStudentData(userId, cleanedStudentData);
    }
  };

  const handleNext = async () => {
    try {
      // Save data, but don't block navigation on errors for step 1
      try {
        await saveData();
      } catch (saveError) {
        console.error("Error saving data:", saveError);
        // For step 1, we can continue even if save fails
        if (currentStep > 1) {
          throw saveError;
        }
      }
      
      // Navigate to next step
      if (currentStep < totalSteps) {
        const nextStep = currentStep + 1;
        router.push(`/onboarding/student/${nextStep}`);
      } else {
        // After last step, complete onboarding
        try {
          await updateUserData(userId, { onboardingCompleted: true });
          router.push("/app/student/dashboard");
        } catch (updateError) {
          console.error("Error updating user data:", updateError);
          // Still redirect to dashboard even if update fails
          router.push("/app/student/dashboard");
        }
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      // Show user-friendly error message
      alert("There was an error. Please try again.");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(`/onboarding/student/${currentStep - 1}`);
    }
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return formData.age > 0 && (formData.age >= 16 || (!!formData.guardianName && !!formData.guardianEmail && !!formData.guardianConsent));
      case 3:
        return formData.sports.length > 0;
      case 4:
        return formData.level !== "";
      case 5:
        return formData.goals.length > 0;
      case 6:
        return formData.focusAreas.length > 0;
      case 7:
        return true; // Final step
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <GradientCard>
            <h2 className="text-3xl font-bold mb-4">Welcome to Coachify!</h2>
            <p className="text-gray-400 mb-6">
              We&apos;re excited to help you find the perfect coach. Let&apos;s get started by learning a bit about you.
            </p>
            <p className="text-sm text-gray-500">
              This will take about 5 minutes. You can always update your preferences later.
            </p>
          </GradientCard>
        );

      case 2:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Age and Guardian Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Your Age</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>

              {formData.age > 0 && formData.age < 16 && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-400 font-semibold mb-4">
                    You must have a parent or guardian involved to use Coachify.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Guardian Full Name</label>
                      <input
                        type="text"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Guardian Email</label>
                      <input
                        type="email"
                        value={formData.guardianEmail}
                        onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.guardianConsent}
                  onChange={(e) => setFormData({ ...formData, guardianConsent: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="consent" className="text-sm text-gray-300">
                  I agree to the Terms and confirm guardian involvement if required
                </label>
              </div>
            </div>
          </GradientCard>
        );

      case 3:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Which sports interest you?</h2>
            <p className="text-gray-400 mb-6 text-sm">Select all that apply (at least one required)</p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {SPORTS.map((sport) => (
                <SportIconCard
                  key={sport}
                  sport={sport}
                  selected={formData.sports.includes(sport)}
                  onClick={() => {
                    const newSports = formData.sports.includes(sport)
                      ? formData.sports.filter((s) => s !== sport)
                      : [...formData.sports, sport];
                    setFormData({
                      ...formData,
                      sports: newSports,
                      primarySport: newSports[0] || "",
                    });
                  }}
                />
              ))}
            </div>
          </GradientCard>
        );

      case 4:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">What&apos;s your skill level?</h2>
            <p className="text-gray-400 mb-6 text-sm">For {formData.primarySport || "your primary sport"}</p>
            <div className="space-y-4">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, level })}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    ${formData.level === level
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="font-semibold text-lg mb-1">{level}</div>
                  <div className="text-sm text-gray-400">{SKILL_LEVEL_DESCRIPTIONS[level]}</div>
                </button>
              ))}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Years of experience (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  placeholder="e.g., 3"
                />
              </div>
            </div>
          </GradientCard>
        );

      case 5:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">What are your goals?</h2>
            <p className="text-gray-400 mb-6 text-sm">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STUDENT_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    const newGoals = formData.goals.includes(goal)
                      ? formData.goals.filter((g) => g !== goal)
                      : [...formData.goals, goal];
                    setFormData({ ...formData, goals: newGoals });
                  }}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${formData.goals.includes(goal)
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="font-medium">{goal}</div>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                What does success look like in 3 months?
              </label>
              <textarea
                value={formData.successIn3Months}
                onChange={(e) => setFormData({ ...formData, successIn3Months: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                placeholder="Describe your vision for success..."
              />
            </div>
          </GradientCard>
        );

      case 6:
        const focusAreas = formData.primarySport ? SPORT_FOCUS_AREAS[formData.primarySport as Sport] || [] : [];
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Focus Areas</h2>
            <p className="text-gray-400 mb-6 text-sm">
              What would you like to focus on in {formData.primarySport}? (Select all that apply)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {focusAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => {
                    const newAreas = formData.focusAreas.includes(area)
                      ? formData.focusAreas.filter((a) => a !== area)
                      : [...formData.focusAreas, area];
                    setFormData({ ...formData, focusAreas: newAreas });
                  }}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${formData.focusAreas.includes(area)
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="font-medium text-sm">{area}</div>
                </button>
              ))}
            </div>
          </GradientCard>
        );

      case 7:
        return (
          <GradientCard>
            <h2 className="text-3xl font-bold mb-4">You&apos;re all set! 🎉</h2>
            <p className="text-gray-400 mb-6">
              Based on your preferences, we&apos;ve found some great coaches and courses for you.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                You can always update your preferences from your dashboard.
              </p>
            </div>
          </GradientCard>
        );

      default:
        return null;
    }
  };

  return (
    <WizardStepShell
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={handleBack}
      onNext={handleNext}
      canGoNext={canGoNext()}
    >
      {renderStep()}
    </WizardStepShell>
  );
}

