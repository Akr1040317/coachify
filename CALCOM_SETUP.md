# Cal.com Integration Setup Guide

This guide explains how to set up and use the Cal.com integration for advanced calendar and booking management.

## Overview

The Cal.com integration provides:
- **Advanced Calendar Management**: Coaches can set weekly availability that syncs with Cal.com
- **Time Slot Selection**: Students see real-time available slots from Cal.com
- **Payment-Gated Bookings**: Bookings are created but not confirmed until payment
- **Cancellation & Rescheduling**: Handle cancellations and rescheduling with automatic refunds
- **Calendar Sync**: Bookings automatically appear on coach's Cal.com calendar

## Prerequisites

1. **Cal.com Account**: Sign up at [cal.com](https://cal.com)
2. **API Key**: Get your API key from Cal.com Settings > Security
3. **Stripe Integration**: Ensure Stripe is set up for payments (already configured)

## Environment Variables

Add these to your `.env.local` file:

```bash
# Cal.com API Configuration
CALCOM_API_KEY=your_calcom_api_key_here
CALCOM_API_URL=https://api.cal.com/v2  # Optional, defaults to this
```

## Setup Steps

### 1. Initial Coach Setup

When a coach first sets their availability:

1. Coach goes to `/app/coach/availability`
2. Sets their weekly availability slots
3. Clicks "Sync with Cal.com"
4. System creates a Cal.com user and schedule for the coach

### 2. Create Event Types for Offerings

For each session offering (30min, 60min, custom):

1. System automatically creates a Cal.com event type
2. Event type is linked to the offering
3. Event type requires payment confirmation

### 3. Booking Flow

**Student Side:**
1. Student selects a coach and offering
2. System fetches available slots from Cal.com
3. Student selects a time slot
4. System creates a **pending** booking in Cal.com
5. Student is redirected to Stripe checkout
6. After payment, booking is **confirmed** in Cal.com
7. Booking appears on coach's calendar

**Coach Side:**
1. Coach sees booking in their Cal.com calendar
2. Coach can manage bookings through Cal.com or Coachify dashboard

## API Endpoints

### Sync Availability
```
POST /api/calcom/sync-availability
Body: { coachId, availability }
```

### Get Available Slots
```
GET /api/calcom/available-slots?coachId=xxx&eventTypeId=xxx&dateFrom=xxx&dateTo=xxx
```

### Create Booking (Pending Payment)
```
POST /api/calcom/create-booking
Body: { coachId, eventTypeId, startTime, endTime, userId, offeringId }
```

### Confirm Booking (After Payment)
```
POST /api/calcom/confirm-booking
Body: { bookingId, calcomBookingId }
```

### Cancel Booking
```
POST /api/calcom/cancel-booking
Body: { bookingId, reason, refundAmount?, refundReason? }
```

### Reschedule Booking
```
POST /api/calcom/reschedule-booking
Body: { bookingId, newStartTime, newEndTime, refundDifference?, reason? }
```

## Cancellation & Refund Flow

### Coach Cancels
1. Coach cancels booking in dashboard or Cal.com
2. System automatically:
   - Cancels booking in Cal.com
   - Processes full refund to student
   - Updates booking status to "cancelled"
   - Sends notification to student

### Student Cancels
1. Student cancels booking
2. System checks cancellation policy:
   - **> 24 hours before**: Full refund
   - **< 24 hours before**: Partial refund (50%)
   - **< 2 hours before**: No refund
3. Processes refund accordingly
4. Updates booking status

### Rescheduling
1. Coach or student requests reschedule
2. System checks:
   - New time slot availability
   - Price difference (if offering changed)
3. If price increased: Student pays difference
4. If price decreased: System refunds difference
5. Updates booking with new times

## Webhook Configuration

Set up Cal.com webhooks to receive real-time updates:

1. Go to Cal.com Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/calcom`
3. Select events:
   - `BOOKING_CREATED`
   - `BOOKING_CONFIRMED`
   - `BOOKING_CANCELLED`
   - `BOOKING_RESCHEDULED`

## Data Structure

### Coach Data (Firestore)
```typescript
{
  calcomUserId: number;        // Cal.com user ID
  calcomScheduleId: number;    // Cal.com schedule ID
  availabilitySlots: [...],   // Local availability copy
  customOfferings: [{
    id: string;
    calcomEventTypeId: number; // Linked Cal.com event type
    ...
  }]
}
```

### Booking Data (Firestore)
```typescript
{
  calcomBookingId: number;     // Cal.com booking ID
  calcomBookingUid: string;    // Cal.com booking UID
  status: "requested" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  ...
}
```

## Troubleshooting

### "Cal.com API key not configured"
- Check `.env.local` has `CALCOM_API_KEY`
- Restart development server after adding env var

### "Coach not synced with Cal.com"
- Coach needs to sync availability first
- Go to `/app/coach/availability` and click "Sync with Cal.com"

### Bookings not appearing in Cal.com
- Check booking was confirmed after payment
- Verify `calcomBookingId` is set in Firestore
- Check Cal.com webhook logs

### Refunds not processing
- Verify Stripe payment intent ID exists
- Check Stripe dashboard for refund status
- Review refund API logs

## Best Practices

1. **Always sync availability first** before creating bookings
2. **Handle errors gracefully** - Cal.com API may be temporarily unavailable
3. **Keep local copies** of availability and bookings for fallback
4. **Monitor webhooks** for real-time updates
5. **Test cancellation policies** thoroughly before production

## Support

For Cal.com API issues:
- [Cal.com API Documentation](https://cal.com/docs/api-reference/v2)
- [Cal.com Support](https://cal.com/support)

For integration issues:
- Check application logs
- Review Firestore data structure
- Verify API credentials


