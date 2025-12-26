#!/bin/bash

# Script to set up Stripe webhook for local testing
# This will start Stripe CLI to forward webhooks to your local server

echo "🔧 Setting up Stripe webhook for local testing..."
echo ""
echo "Make sure your Next.js dev server is running on port 3000"
echo "Press Ctrl+C to stop the webhook listener"
echo ""
echo "Starting Stripe webhook listener..."
echo "Copy the 'webhook signing secret' (whsec_...) and add it to your .env.local as STRIPE_WEBHOOK_SECRET"
echo ""

# Start Stripe CLI webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

