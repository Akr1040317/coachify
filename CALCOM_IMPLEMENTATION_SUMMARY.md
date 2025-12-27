# Cal.com Integration Implementation Summary

## ✅ What's Been Implemented

### 1. **Cal.com API Client** (`lib/calcom/client.ts`)
- Full TypeScript client for Cal.com API v2
- Handles authentication, user management, event types, schedules, bookings
- Methods for creating, updating, canceling, and rescheduling bookings
- Time slot availability checking

### 2. **API Routes**
All routes are in `/app/api/calcom/`:

- **`sync-availability`**: Syncs coach availability with Cal.com
- **`create-event-type`**: Creates/updates event types for session offerings
- **`available-slots`**: Gets available time slots from Cal.com
- **`create-booking`**: Creates a pending booking (before payment)
- **`confirm-booking`**: Confirms booking after payment succeeds
- **`cancel-booking`**: Cancels booking and handles refunds
- **`reschedule-booking`**: Reschedules booking and handles price differences

### 3. **Webhook Handler** (`app/api/webhooks/calcom/route.ts`)
- Handles Cal.com webhook events
- Processes booking updates from Cal.com

### 4. **Updated Availability Page**
- Added "Sync with Cal.com" button
- Shows sync status
- Automatically creates Cal.com user and schedule

### 5. **Stripe Webhook Integration**
- Updated to confirm Cal.com bookings after payment
- Links payment success to booking confirmation

## 🔄 How It Works

### Booking Flow:

1. **Coach Setup**:
   - Coach sets availability in `/app/coach/availability`
   - Clicks "Sync with Cal.com"
   - System creates Cal.com user and schedule
   - For each offering, system creates a Cal.com event type

2. **Student Booking**:
   - Student selects coach and offering
   - System fetches available slots from Cal.com
   - Student selects a time slot
   - System creates **pending** booking in Cal.com
   - Student redirected to Stripe checkout
   - After payment, Stripe webhook:
     - Confirms booking in Cal.com
     - Updates booking status to "confirmed"
     - Booking appears on coach's Cal.com calendar

3. **Cancellation**:
   - Coach or student cancels booking
   - System cancels in Cal.com
   - Processes refund based on cancellation policy
   - Updates booking status

4. **Rescheduling**:
   - Coach or student requests reschedule
   - System checks new slot availability
   - Calculates price difference
   - Processes refund or charges difference
   - Updates booking times

## 📋 Next Steps (To Complete Integration)

### 1. Update Booking Flow (`app/app/student/bookings/new/page.tsx`)
Currently uses local availability calculation. Need to:
- Fetch available slots from Cal.com API
- Use Cal.com event types for offerings
- Create Cal.com booking before Stripe checkout

### 2. Add Cancellation UI
- Add cancel/reschedule buttons to booking pages
- Implement cancellation policy logic
- Show refund amounts

### 3. Environment Variables
Add to `.env.local`:
```bash
CALCOM_API_KEY=your_api_key_here
CALCOM_API_URL=https://api.cal.com/v2  # Optional
```

### 4. Test Integration
- Test availability sync
- Test booking creation
- Test payment confirmation
- Test cancellation and refunds
- Test rescheduling

## 🎯 Key Features

✅ **Payment-Gated Bookings**: Bookings created but not confirmed until payment
✅ **Automatic Calendar Sync**: Bookings appear on coach's Cal.com calendar
✅ **Refund Handling**: Automatic refunds for cancellations
✅ **Price Difference Handling**: Handles price changes on reschedule
✅ **Webhook Support**: Real-time updates from Cal.com

## 🔧 Configuration

### Cal.com Setup:
1. Sign up at cal.com
2. Get API key from Settings > Security
3. Add to environment variables
4. Set up webhooks (optional but recommended)

### Webhook URL:
```
https://yourdomain.com/api/webhooks/calcom
```

Events to subscribe:
- `BOOKING_CREATED`
- `BOOKING_CONFIRMED`
- `BOOKING_CANCELLED`
- `BOOKING_RESCHEDULED`

## 📚 Documentation

See `CALCOM_SETUP.md` for detailed setup instructions.

## ⚠️ Important Notes

1. **Cal.com API Key Required**: Features will be disabled without API key
2. **Coach Must Sync First**: Coaches need to sync availability before bookings
3. **Event Types**: System automatically creates event types for offerings
4. **Fallback**: System keeps local availability copy for fallback
5. **Error Handling**: All Cal.com operations have try-catch for graceful failures

## 🐛 Troubleshooting

- **"Cal.com API key not configured"**: Add `CALCOM_API_KEY` to `.env.local`
- **"Coach not synced"**: Coach needs to sync availability first
- **Bookings not appearing**: Check booking was confirmed after payment
- **Refunds not working**: Verify Stripe payment intent ID exists


