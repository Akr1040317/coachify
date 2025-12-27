/**
 * Cal.com API Client
 * 
 * This client handles all interactions with the Cal.com API v2
 * Documentation: https://cal.com/docs/api-reference/v2
 */

const CALCOM_API_BASE = process.env.CALCOM_API_URL || "https://api.cal.com/v2";
const CALCOM_API_KEY = process.env.CALCOM_API_KEY;

interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number; // in minutes
  userId: number;
  description?: string;
  price?: number;
  currency?: string;
  requiresConfirmation?: boolean;
  hidden?: boolean;
}

interface CalComSchedule {
  id: number;
  name: string;
  timeZone: string;
  userId: number;
  availability: CalComAvailability[];
}

interface CalComAvailability {
  id: number;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  date?: string; // For date-specific availability
}

interface CalComBooking {
  id: number;
  uid: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  eventTypeId: number;
  userId: number;
  attendees: Array<{
    email: string;
    name: string;
    timeZone: string;
  }>;
  payment?: Array<{
    id: number;
    success: boolean;
    amount: number;
    currency: string;
  }>;
}

interface CalComTimeSlot {
  time: string; // ISO 8601
  available: boolean;
}

class CalComClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || CALCOM_API_KEY || "";
    this.baseUrl = baseUrl || CALCOM_API_BASE;

    if (!this.apiKey) {
      console.warn("Cal.com API key not configured. Cal.com features will be disabled.");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Cal.com API key not configured");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`Cal.com API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get or create a user in Cal.com
   * Returns the Cal.com user ID
   */
  async getOrCreateUser(email: string, name: string, username: string): Promise<number> {
    try {
      // Try to find existing user
      const users = await this.request<{ users: Array<{ id: number; email: string }> }>("/users");
      const existingUser = users.users?.find(u => u.email === email);
      
      if (existingUser) {
        return existingUser.id;
      }

      // Create new user
      const newUser = await this.request<{ user: { id: number } }>("/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          name,
          username,
          timeZone: "America/New_York", // Default, can be made configurable
        }),
      });

      return newUser.user.id;
    } catch (error) {
      console.error("Error getting/creating Cal.com user:", error);
      throw error;
    }
  }

  /**
   * Create an event type for a coach
   */
  async createEventType(
    userId: number,
    title: string,
    length: number,
    price?: number,
    currency: string = "USD",
    description?: string
  ): Promise<CalComEventType> {
    const eventType = await this.request<{ event_type: CalComEventType }>("/event-types", {
      method: "POST",
      body: JSON.stringify({
        title,
        length,
        userId,
        price: price ? price * 100 : undefined, // Cal.com uses cents
        currency,
        description,
        requiresConfirmation: true, // Require payment before confirmation
        hidden: false,
      }),
    });

    return eventType.event_type;
  }

  /**
   * Get event types for a user
   */
  async getEventTypes(userId: number): Promise<CalComEventType[]> {
    const response = await this.request<{ event_types: CalComEventType[] }>(`/event-types?userId=${userId}`);
    return response.event_types || [];
  }

  /**
   * Update event type
   */
  async updateEventType(eventTypeId: number, updates: Partial<CalComEventType>): Promise<CalComEventType> {
    const eventType = await this.request<{ event_type: CalComEventType }>(`/event-types/${eventTypeId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    return eventType.event_type;
  }

  /**
   * Create or update schedule for a user
   */
  async createOrUpdateSchedule(
    userId: number,
    name: string,
    timeZone: string,
    availability: CalComAvailability[]
  ): Promise<CalComSchedule> {
    // Get existing schedules
    const schedules = await this.request<{ schedules: CalComSchedule[] }>(`/schedules?userId=${userId}`);
    const existingSchedule = schedules.schedules?.find(s => s.userId === userId);

    if (existingSchedule) {
      // Update existing schedule
      const updated = await this.request<{ schedule: CalComSchedule }>(`/schedules/${existingSchedule.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          timeZone,
          availability,
        }),
      });
      return updated.schedule;
    } else {
      // Create new schedule
      const created = await this.request<{ schedule: CalComSchedule }>("/schedules", {
        method: "POST",
        body: JSON.stringify({
          name,
          timeZone,
          userId,
          availability,
        }),
      });
      return created.schedule;
    }
  }

  /**
   * Get available time slots for a date range
   */
  async getAvailableSlots(
    eventTypeId: number,
    dateFrom: string, // ISO 8601 date
    dateTo: string, // ISO 8601 date
    timeZone?: string
  ): Promise<CalComTimeSlot[]> {
    const params = new URLSearchParams({
      eventTypeId: eventTypeId.toString(),
      dateFrom,
      dateTo,
      ...(timeZone && { timeZone }),
    });

    const response = await this.request<{ slots: CalComTimeSlot[] }>(`/slots/available?${params}`);
    return response.slots || [];
  }

  /**
   * Create a booking (pending payment)
   */
  async createBooking(
    eventTypeId: number,
    startTime: string, // ISO 8601
    endTime: string, // ISO 8601
    attendeeEmail: string,
    attendeeName: string,
    timeZone: string = "America/New_York",
    metadata?: Record<string, any>
  ): Promise<CalComBooking> {
    const booking = await this.request<{ booking: CalComBooking }>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        eventTypeId,
        startTime,
        endTime,
        attendees: [
          {
            email: attendeeEmail,
            name: attendeeName,
            timeZone,
          },
        ],
        metadata,
      }),
    });

    return booking.booking;
  }

  /**
   * Confirm a booking (after payment)
   */
  async confirmBooking(bookingId: number): Promise<CalComBooking> {
    const booking = await this.request<{ booking: CalComBooking }>(`/bookings/${bookingId}/confirm`, {
      method: "POST",
    });

    return booking.booking;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: number, reason?: string): Promise<CalComBooking> {
    const booking = await this.request<{ booking: CalComBooking }>(`/bookings/${bookingId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });

    return booking.booking;
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: number,
    newStartTime: string, // ISO 8601
    newEndTime: string // ISO 8601
  ): Promise<CalComBooking> {
    const booking = await this.request<{ booking: CalComBooking }>(`/bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({
        startTime: newStartTime,
        endTime: newEndTime,
      }),
    });

    return booking.booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: number): Promise<CalComBooking> {
    const booking = await this.request<{ booking: CalComBooking }>(`/bookings/${bookingId}`);
    return booking.booking;
  }

  /**
   * Get bookings for a user
   */
  async getUserBookings(userId: number, filters?: {
    status?: string;
    from?: string;
    to?: string;
  }): Promise<CalComBooking[]> {
    const params = new URLSearchParams({
      userId: userId.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.from && { from: filters.from }),
      ...(filters?.to && { to: filters.to }),
    });

    const response = await this.request<{ bookings: CalComBooking[] }>(`/bookings?${params}`);
    return response.bookings || [];
  }
}

// Export singleton instance
export const calcomClient = new CalComClient();

// Export types
export type {
  CalComEventType,
  CalComSchedule,
  CalComAvailability,
  CalComBooking,
  CalComTimeSlot,
};

