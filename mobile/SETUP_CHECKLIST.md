# RevenueCat Setup Checklist

Copy this checklist and check off each item as you complete it.

## Phase 1: Google Play Console (30 mins)

```
[ ] 1. Create app in Play Console (if not already done)
[ ] 2. Go to Monetize → Products → In-app products
[ ] 3. Create product: mror_pro_monthly ($9.99/month)
[ ] 4. Create product: mror_pro_annual ($99.99/year)
[ ] 5. Activate both products
[ ] 6. Go to Setup → API access
[ ] 7. Create service account: "revenuecat-api"
[ ] 8. Download JSON key file
[ ] 9. Grant access to service account in Play Console
```

**You should have:**
- ✅ 2 active products in Play Console
- ✅ JSON key file downloaded

---

## Phase 2: RevenueCat Dashboard (20 mins)

```
[ ] 10. Sign up at https://app.revenuecat.com
[ ] 11. Create new project: "Mror"
[ ] 12. Add Android app (bundle ID: com.mror.app)
[ ] 13. Upload Google Play service account JSON
[ ] 14. Go to Products → Add "mror_pro_monthly"
[ ] 15. Go to Products → Add "mror_pro_annual"
[ ] 16. Go to Entitlements → Create "Pro" (capital P!)
[ ] 17. Go to Offerings → Create "default" offering
[ ] 18. Add monthly package to offering (attach Pro entitlement)
[ ] 19. Add annual package to offering (attach Pro entitlement)
[ ] 20. Set offering as "Current"
[ ] 21. Go to Project Settings → API keys
[ ] 22. Copy Android SDK key (starts with goog_)
```

**You should have:**
- ✅ Android app configured in RevenueCat
- ✅ 2 products added
- ✅ 1 entitlement created ("Pro")
- ✅ 1 offering with 2 packages
- ✅ Android SDK key copied

---

## Phase 3: Update Mobile App (5 mins)

```
[ ] 23. Open /home/d/lotus/mobile/app.json
[ ] 24. Replace revenueCatAndroidKey with your real key
[ ] 25. Save the file
[ ] 26. Run: npx expo start --clear
[ ] 27. Check console for "RevenueCat initialized successfully"
```

**You should see:**
- ✅ No "Invalid API key" errors
- ✅ "RevenueCat initialized and verified successfully" in logs

---

## Phase 4: Backend Webhook (30 mins)

```
[ ] 28. Go to RevenueCat → Project Settings → Integrations
[ ] 29. Add webhook: https://www.mror.app/api/webhooks/revenuecat
[ ] 30. Select events: Initial Purchase, Renewal, Cancellation, Expiration
[ ] 31. Copy authorization header
[ ] 32. Add to backend .env: REVENUECAT_WEBHOOK_SECRET=<value>
[ ] 33. Create webhook endpoint in backend (see guide)
[ ] 34. Deploy backend
[ ] 35. Test webhook with RevenueCat dashboard "Send test event"
```

**You should have:**
- ✅ Webhook endpoint receiving events
- ✅ Backend logs showing webhook received
- ✅ User subscription status updating in database

---

## Phase 5: Testing (1 hour)

```
[ ] 36. Build release APK/AAB
[ ] 37. Upload to Play Console → Internal testing
[ ] 38. Add yourself as tester
[ ] 39. Install test app on device
[ ] 40. Sign in to your app
[ ] 41. Navigate to subscription screen
[ ] 42. Attempt purchase
[ ] 43. Complete purchase (use test payment)
[ ] 44. Check RevenueCat dashboard for purchase event
[ ] 45. Check backend logs for webhook
[ ] 46. Verify Pro features are unlocked in app
[ ] 47. Check database that user has Pro status
```

**You should see:**
- ✅ Purchase completes successfully
- ✅ Event appears in RevenueCat dashboard
- ✅ Webhook received by backend
- ✅ User granted Pro in database
- ✅ Pro features unlocked in app

---

## Common Issues & Quick Fixes

### Issue: "Invalid API key"
**Fix:** You used the wrong key type. Use SDK keys (goog_xxx), not public API key

### Issue: "No products found"
**Fix:** Products take 2-4 hours to propagate. Wait and try again.

### Issue: Products show but can't purchase
**Fix:**
1. App must be signed with release key
2. App must be uploaded to Play Console
3. You must be a tester in Internal Testing track

### Issue: Purchase works but no webhook
**Fix:**
1. Check webhook URL is correct
2. Verify authorization header in backend
3. Check backend is publicly accessible
4. Look at RevenueCat → Integrations → Webhook history

### Issue: "Singleton instance" error
**Fix:** Check app.json has correct keys, restart app completely

---

## After Everything Works

```
[ ] 48. Document your setup for future reference
[ ] 49. Set up monitoring/alerts for webhook failures
[ ] 50. Add error tracking (Sentry, etc.)
[ ] 51. Test cancellation flow
[ ] 52. Test restore purchases
[ ] 53. Prepare for production release
```

---

## Production Checklist

```
[ ] All tests passing
[ ] Webhook endpoint tested and monitored
[ ] Error handling in place
[ ] Customer support process defined
[ ] Refund policy documented
[ ] Privacy policy updated (mention subscriptions)
[ ] App Store listing mentions in-app purchases
```

---

## Quick Command Reference

```bash
# Clear expo cache and restart
npx expo start --clear

# Build for Android
npx eas build --platform android

# Check TypeScript errors
npx tsc --noEmit

# View app logs
npx react-native log-android
```

---

## Key URLs to Bookmark

- Play Console: https://play.google.com/console
- RevenueCat: https://app.revenuecat.com
- RevenueCat Docs: https://docs.revenuecat.com/docs/android
- Your webhook endpoint: https://www.mror.app/api/webhooks/revenuecat

---

**Estimated Total Time:** 2-3 hours (first time)
**Estimated Time After Practice:** 30-45 minutes

Good luck! 🚀
