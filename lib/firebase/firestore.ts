import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  orderBy,
  limit,
  deleteDoc,
  getDocFromCache,
} from "firebase/firestore";
import { db } from "./config";

// User types
export interface UserData {
  createdAt: Timestamp;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "student" | "coach" | "admin";
  guardianRequired?: boolean;
  guardianName?: string;
  guardianEmail?: string;
  onboardingCompleted: boolean;
  referredByCoachId?: string; // Coach ID who referred this student
}

export interface StudentData {
  age: number;
  sports: string[];
  primarySport: string;
  level: string;
  yearsExperience?: number;
  goals: string[];
  successIn3Months?: string;
  focusAreas: string[];
  preferences: {
    coachingStyle: string[];
    sessionLength: number[];
    budgetRangeCents: { min: number; max: number };
    availability: string[];
    language?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CoachData {
  userId: string;
  displayName: string;
  headline: string;
  bio: string;
  coachingPhilosophy?: string;
  timezone: string;
  timeZone?: string; // Legacy camelCase support
  location: string;
  sports: string[];
  specialtiesBySport: { [sport: string]: string[] };
  experienceType: string;
  credentials: string[];
  socialLinks: { linkedin?: string; youtube?: string; instagram?: string };
  avatarUrl?: string;
  introVideoUrl?: string;
  introVideoThumbnailUrl?: string;
  isVerified: boolean;
  status: "draft" | "pending_verification" | "active" | "suspended";
  sessionOffers: {
    freeIntroEnabled: boolean;
    freeIntroMinutes: number;
    paid: Array<{ minutes: number; priceCents: number; currency: string }>;
  };
  customOfferings?: Array<{
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
    isFree: boolean;
    isActive: boolean;
    bufferMinutes?: number;
    color?: string;
  }>;
  ratingAvg?: number;
  ratingCount?: number;
  stripeConnectAccountId?: string;
  stripeConnectStatus?: "pending" | "active" | "restricted";
  lastPayoutDate?: Timestamp;
  nextPayoutDate?: Timestamp;
  complianceStatus?: "pending" | "approved" | "flagged" | "rejected";
  complianceCheckDate?: Timestamp;
  complianceNotes?: string;
  availabilitySlots?: Array<{
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    isAvailable: boolean;
  }>;
  availabilityOverrides?: Array<{
    date: string; // ISO date string
    isAvailable: boolean;
    startTime?: string; // Override start time
    endTime?: string; // Override end time
  }>;
  googleCalendarAccessToken?: string; // Encrypted
  googleCalendarRefreshToken?: string; // Encrypted
  googleCalendarSyncEnabled?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User operations
export const getUserData = async (uid: string): Promise<UserData | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

export const createUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    onboardingCompleted: false,
  } as UserData);
};

export const updateUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "users", uid);
  
  // Check if document exists first
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await updateDoc(docRef, data);
  } else {
    // Document doesn't exist, create it with the data
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      onboardingCompleted: false,
    } as UserData);
  }
};

// Student operations
export const getStudentData = async (uid: string): Promise<StudentData | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "students", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as StudentData;
  }
  return null;
};

export const createStudentData = async (uid: string, data: Partial<StudentData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "students", uid);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as StudentData);
};

export const updateStudentData = async (uid: string, data: Partial<StudentData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "students", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Coach operations
export const getCoachData = async (coachId: string): Promise<CoachData | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "coaches", coachId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as CoachData;
  }
  return null;
};

export const createCoachData = async (coachId: string, data: Partial<CoachData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "coaches", coachId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as CoachData);
};

export const updateCoachData = async (coachId: string, data: Partial<CoachData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "coaches", coachId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getCoaches = async (constraints: QueryConstraint[] = []): Promise<(CoachData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "coaches"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachData & { id: string }));
};

// Course types and operations
export interface CourseData {
  coachId: string;
  title: string;
  description: string;
  outcomes: string[];
  sport: string;
  skillLevel: "beginner" | "intermediate" | "advanced" | "competitive";
  priceCents: number;
  currency: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  videoIds?: string[]; // Array of video IDs in order
  articleIds?: string[]; // Array of article IDs in order
  estimatedMinutes?: number; // Total estimated time for the course
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LessonData {
  title: string;
  description: string;
  order: number;
  videoUrl: string;
  durationSeconds: number;
  createdAt: Timestamp;
}

export const getCourse = async (courseId: string): Promise<CourseData | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "courses", courseId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as CourseData & { id: string };
  }
  return null;
};

export const getCourses = async (constraints: QueryConstraint[] = []): Promise<(CourseData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "courses"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseData & { id: string }));
};

export const createCourse = async (data: Partial<CourseData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  
  // Remove undefined values - Firestore doesn't allow them
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );
  
  const docRef = await addDoc(collection(db, "courses"), {
    ...cleanedData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCourse = async (courseId: string, data: Partial<CourseData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "courses", courseId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "courses", courseId);
  await deleteDoc(docRef);
};

export const getCourseLessons = async (courseId: string): Promise<(LessonData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "courses", courseId, "lessons"), orderBy("order"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonData & { id: string }));
};

export const addCourseLesson = async (courseId: string, data: Partial<LessonData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "courses", courseId, "lessons"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Video types and operations
export interface VideoData {
  coachId: string;
  title: string;
  description: string;
  sport: string;
  tags: string[];
  isFree: boolean;
  priceCents?: number;
  videoUrl: string;
  thumbnailUrl?: string;
  visibility: "public" | "unlisted";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const getVideo = async (videoId: string): Promise<(VideoData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "videos", videoId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as VideoData & { id: string };
  }
  return null;
};

export const getVideos = async (constraints: QueryConstraint[] = []): Promise<(VideoData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "videos"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData & { id: string }));
};

export const createVideo = async (data: Partial<VideoData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "videos"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateVideo = async (videoId: string, data: Partial<VideoData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "videos", videoId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Article types and operations
export interface ArticleData {
  authorCoachId: string;
  title: string;
  slug: string;
  sport: string;
  tags: string[];
  excerpt: string;
  contentHtml: string;
  coverImageUrl?: string;
  status: "draft" | "published";
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const getArticle = async (articleId: string): Promise<(ArticleData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "articles", articleId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ArticleData & { id: string };
  }
  return null;
};

export const getArticles = async (constraints: QueryConstraint[] = []): Promise<(ArticleData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "articles"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArticleData & { id: string }));
};

export const createArticle = async (data: Partial<ArticleData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "articles"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateArticle = async (articleId: string, data: Partial<ArticleData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "articles", articleId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Booking types and operations
export interface BookingData {
  studentId: string;
  coachId: string;
  type: "free_intro" | "paid";
  sessionMinutes: number;
  priceCents: number;
  currency: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  scheduledStart: Timestamp;
  scheduledEnd: Timestamp;
  meetingLink?: string;
  stripeCheckoutSessionId?: string;
  customOfferingId?: string;
  timeZone?: string; // Coach's timezone at booking time
  bufferMinutes?: number; // Buffer time from offering
  cancellationPolicy?: {
    hoursBeforeFullRefund: number; // e.g., 24
    hoursBeforePartialRefund: number; // e.g., 2
    partialRefundPercent: number; // e.g., 50
  };
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  cancelledBy?: "coach" | "student";
  refundId?: string; // Stripe refund ID
  refundAmountCents?: number;
  rescheduledAt?: Timestamp;
  rescheduleReason?: string;
  originalScheduledStart?: Timestamp; // For rescheduled bookings
  googleCalendarEventId?: string; // For Google Calendar sync
  stripePaymentIntentId?: string; // Link to payment
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const getBooking = async (bookingId: string): Promise<(BookingData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "bookings", bookingId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as BookingData & { id: string };
  }
  return null;
};

export const getBookings = async (constraints: QueryConstraint[] = []): Promise<(BookingData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "bookings"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingData & { id: string }));
};

export const createBooking = async (data: Partial<BookingData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "bookings"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateBooking = async (bookingId: string, data: Partial<BookingData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "bookings", bookingId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Purchase types and operations
export interface PurchaseData {
  id?: string;
  userId: string;
  coachId: string;
  type: "course" | "paid_video" | "session";
  courseId?: string;
  videoId?: string;
  bookingId?: string;
  amountCents: number;
  platformFeeCents: number; // NEW
  coachEarningsCents: number; // NEW
  currency: string;
  stripePaymentIntentId: string; // NEW
  stripeCheckoutSessionId?: string; // Keep for backward compatibility
  stripeTransferId?: string; // NEW (if paid out)
  payoutId?: string; // NEW (link to payout record)
  status: "pending" | "paid" | "refunded";
  createdAt: Timestamp;
  paidAt?: Timestamp;
}

// Payout types and operations
export interface PayoutData {
  id?: string;
  coachId: string;
  amountCents: number;
  platformFeeCents: number; // Total fees collected in period
  transferId: string;
  status: "pending" | "paid" | "failed";
  payoutPeriodStart: Timestamp;
  payoutPeriodEnd: Timestamp;
  transactionIds: string[]; // All transaction IDs included
  createdAt: Timestamp;
  paidAt?: Timestamp;
  failureReason?: string;
}

export interface PendingPayoutData {
  coachId: string;
  amountCents: number;
  transactionIds: string[];
  lastUpdated: Timestamp;
}

// Dispute/Chargeback types and operations
export interface DisputeData {
  id?: string;
  purchaseId: string;
  userId: string;
  coachId: string;
  stripeDisputeId: string;
  stripeChargeId: string;
  amountCents: number;
  currency: string;
  reason: string; // e.g., "fraudulent", "product_unacceptable", "subscription_canceled"
  status: "warning_needs_response" | "warning_under_review" | "warning_closed" | "needs_response" | "under_review" | "charge_refunded" | "won" | "lost";
  evidenceDueBy?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  adminNotes?: string;
}

export const createDispute = async (data: Partial<DisputeData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "disputes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getDisputes = async (constraints: QueryConstraint[] = []): Promise<(DisputeData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "disputes"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisputeData & { id: string }));
};

export const updateDispute = async (disputeId: string, data: Partial<DisputeData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "disputes", disputeId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getDispute = async (disputeId: string): Promise<(DisputeData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "disputes", disputeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as DisputeData & { id: string };
  }
  return null;
};

export const getDisputeByStripeId = async (stripeDisputeId: string): Promise<(DisputeData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "disputes"), where("stripeDisputeId", "==", stripeDisputeId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DisputeData & { id: string };
  }
  return null;
};

export const createPurchase = async (data: Partial<PurchaseData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "purchases"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getPurchases = async (constraints: QueryConstraint[] = []): Promise<(PurchaseData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "purchases"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseData & { id: string }));
};

export const updatePurchase = async (purchaseId: string, data: Partial<PurchaseData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "purchases", purchaseId);
  await updateDoc(docRef, data);
};

export const getPurchase = async (purchaseId: string): Promise<(PurchaseData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "purchases", purchaseId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PurchaseData & { id: string };
  }
  return null;
};

// Enrollment types and operations
export interface EnrollmentData {
  userId: string;
  courseId: string;
  purchasedAt: Timestamp;
  progress: { [lessonId: string]: boolean };
}

export const getEnrollment = async (userId: string, courseId: string): Promise<(EnrollmentData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(
    collection(db, "enrollments"),
    where("userId", "==", userId),
    where("courseId", "==", courseId)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as EnrollmentData & { id: string };
  }
  return null;
};

export const getEnrollments = async (constraints: QueryConstraint[] = []): Promise<(EnrollmentData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "enrollments"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrollmentData & { id: string }));
};

export const createEnrollment = async (data: Partial<EnrollmentData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "enrollments"), {
    ...data,
    purchasedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateEnrollment = async (enrollmentId: string, progress: { [lessonId: string]: boolean }): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "enrollments", enrollmentId);
  await updateDoc(docRef, { progress });
};

// Coach student notes
export interface CoachStudentNoteData {
  coachId: string;
  studentId: string;
  bookingId?: string;
  sport: string;
  focusAreas: string[];
  skillRatings?: { [focusArea: string]: number };
  notes: string;
  drills?: string[];
  nextPlan?: string;
  createdAt: Timestamp;
}

export const createCoachNote = async (data: Partial<CoachStudentNoteData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "coachStudentNotes"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getCoachNotes = async (constraints: QueryConstraint[] = []): Promise<(CoachStudentNoteData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "coachStudentNotes"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachStudentNoteData & { id: string }));
};

// Reviews
export interface ReviewData {
  bookingId: string;
  coachId: string;
  studentId: string;
  rating: number;
  text: string;
  createdAt: Timestamp;
}

export const createReview = async (data: Partial<ReviewData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getReviews = async (constraints: QueryConstraint[] = []): Promise<(ReviewData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "reviews"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewData & { id: string }));
};

// Payout operations
export const createPayout = async (data: Partial<PayoutData>): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "payouts"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getPayouts = async (constraints: QueryConstraint[] = []): Promise<(PayoutData & { id: string })[]> => {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(collection(db, "payouts"), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutData & { id: string }));
};

export const updatePayout = async (payoutId: string, data: Partial<PayoutData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "payouts", payoutId);
  await updateDoc(docRef, data);
};

export const getPayout = async (payoutId: string): Promise<(PayoutData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "payouts", payoutId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PayoutData & { id: string };
  }
  return null;
};

// Pending payout operations
export const getPendingPayout = async (coachId: string): Promise<(PendingPayoutData & { id: string }) | null> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "coach_pending_payouts", coachId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PendingPayoutData & { id: string };
  }
  return null;
};

export const updatePendingPayout = async (coachId: string, data: Partial<PendingPayoutData>): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "coach_pending_payouts", coachId);
  const updateData: any = {
    ...data,
    lastUpdated: serverTimestamp(),
  };
  // Check if document exists, if not create it
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await updateDoc(docRef, updateData);
  } else {
    await setDoc(docRef, {
      coachId,
      ...updateData,
    });
  }
};

export const clearPendingPayout = async (coachId: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");
  const docRef = doc(db, "coach_pending_payouts", coachId);
  await updateDoc(docRef, {
    amountCents: 0,
    transactionIds: [],
    lastUpdated: serverTimestamp(),
  });
};

