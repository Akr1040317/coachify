"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardStepShell } from "@/components/ui/WizardStepShell";
import { GradientCard } from "@/components/ui/GradientCard";
import { SportIconCard } from "@/components/ui/SportIconCard";
import { SPORTS, SPORT_FOCUS_AREAS, type Sport } from "@/lib/constants/sports";
import { getCoachData, createCoachData, updateCoachData } from "@/lib/firebase/firestore";
import { updateUserData } from "@/lib/firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

interface CoachOnboardingProps {
  currentStep: number;
  userId: string;
}

export function CoachOnboarding({ currentStep, userId }: CoachOnboardingProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
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

  const totalSteps = 8;

  useEffect(() => {
    const loadData = async () => {
      const coachData = await getCoachData(userId);
      if (coachData) {
        setFormData({
          fullName: coachData.displayName || "",
          location: coachData.location || "",
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
    if (!storage) throw new Error("Storage is not initialized");
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const saveData = async () => {
    let avatarUrl = formData.profilePhotoUrl;
    let introVideoUrl = formData.introVideoUrl;

    if (formData.profilePhoto) {
      avatarUrl = await uploadFile(formData.profilePhoto, `coaches/${userId}/avatar`);
    }

    if (formData.introVideo) {
      introVideoUrl = await uploadFile(formData.introVideo, `coaches/${userId}/intro-video`);
    }

    const coachData = {
      userId,
      displayName: formData.fullName,
      headline: formData.headline,
      bio: formData.bio,
      timezone: formData.timezone,
      location: formData.location,
      sports: formData.sports,
      specialtiesBySport: formData.specialtiesBySport,
      experienceType: formData.experienceType,
      credentials: formData.credentials.split("\n").filter(c => c.trim()),
      socialLinks: {
        linkedin: formData.linkedin || undefined,
        youtube: formData.youtube || undefined,
        instagram: formData.instagram || undefined,
      },
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

    const existing = await getCoachData(userId);
    if (existing) {
      await updateCoachData(userId, coachData);
    } else {
      await createCoachData(userId, coachData);
    }
  };

  const handleNext = async () => {
    await saveData();
    
    if (currentStep < totalSteps) {
      router.push(`/onboarding/coach/${currentStep + 1}`);
    } else {
      await updateUserData(userId, { onboardingCompleted: true });
      router.push("/app/coach/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(`/onboarding/coach/${currentStep - 1}`);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return formData.fullName !== "" && formData.headline !== "";
      case 3:
        return formData.sports.length > 0;
      case 4:
        return formData.experienceType !== "";
      case 5:
        return formData.bio !== "";
      case 6:
        return formData.price30Min > 0 && formData.price60Min > 0;
      case 7:
        return true; // Availability can be set later
      case 8:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <GradientCard>
            <h2 className="text-3xl font-bold mb-4">Welcome, Coach!</h2>
            <p className="text-gray-400 mb-6">
              Let&apos;s set up your coach profile. This will help students discover you and understand your expertise.
            </p>
          </GradientCard>
        );

      case 2:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Identity and Credibility</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Short Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  placeholder="e.g., Former Pro Basketball Player"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn (optional)</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">YouTube (optional)</label>
                  <input
                    type="url"
                    value={formData.youtube}
                    onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram (optional)</label>
                  <input
                    type="url"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </GradientCard>
        );

      case 3:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Sports You Coach</h2>
            <p className="text-gray-400 mb-6 text-sm">Select all sports you coach</p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
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
              <div className="space-y-4">
                <h3 className="font-semibold">Specialties per sport</h3>
                {formData.sports.map((sport) => {
                  const focusAreas = SPORT_FOCUS_AREAS[sport as Sport] || [];
                  const selected = formData.specialtiesBySport[sport] || [];
                  return (
                    <div key={sport} className="p-4 bg-[var(--card)] rounded-lg">
                      <h4 className="font-medium mb-3">{sport}</h4>
                      <div className="flex flex-wrap gap-2">
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
                              px-3 py-1 rounded-full text-sm transition-all
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
            )}
          </GradientCard>
        );

      case 4:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Experience and Credentials</h2>
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
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Intro Video and Bio</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Intro Video</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFormData({ ...formData, introVideo: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Short Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                  placeholder="Tell students about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Coaching Philosophy</label>
                <textarea
                  value={formData.coachingPhilosophy}
                  onChange={(e) => setFormData({ ...formData, coachingPhilosophy: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                  placeholder="What&apos;s your approach to coaching?"
                />
              </div>
            </div>
          </GradientCard>
        );

      case 6:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Pricing and Packages</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="freeIntro"
                  checked={formData.freeIntroEnabled}
                  onChange={(e) => setFormData({ ...formData, freeIntroEnabled: e.target.checked })}
                />
                <label htmlFor="freeIntro" className="font-medium">
                  Offer free intro consultation
                </label>
              </div>
              {formData.freeIntroEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Free intro duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={formData.freeIntroMinutes}
                    onChange={(e) => setFormData({ ...formData, freeIntroMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">30-minute session price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price30Min}
                  onChange={(e) => setFormData({ ...formData, price30Min: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">60-minute session price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price60Min}
                  onChange={(e) => setFormData({ ...formData, price60Min: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
          </GradientCard>
        );

      case 7:
        return (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Availability</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Set your weekly availability. You can update this later from your dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Availability management will be available in your coach dashboard after onboarding.
            </p>
          </GradientCard>
        );

      case 8:
        return (
          <GradientCard>
            <h2 className="text-3xl font-bold mb-4">Almost there! 🎉</h2>
            <p className="text-gray-400 mb-6">
              Your profile is set up and pending verification. Once verified, you&apos;ll be visible to students.
            </p>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                Next steps: Complete Stripe Connect setup to receive payouts. You can do this from your dashboard.
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
