Setup and deploy (quick guide)

1. Install Firebase CLI and login:

   ```bash
   npm i -g firebase-tools
   firebase login
   ```

2. Initialize or connect to your Firebase project (if not already initialized):

   ```bash
   firebase init
   ```

   - Choose Firestore, Functions, and Storage
   - When asked for rules, point to `firebase/firestore.rules` and `firebase/storage.rules`
   - When asked for functions source, choose `functions`

3. Fill environment variables for functions (Stripe keys, email SMTP, etc.)

   ```bash
   firebase functions:config:set stripe.secret="sk_test_..." stripe.webhook_secret="whsec_..."
   ```

4. Deploy rules and functions:

   ```bash
   firebase deploy --only firestore:rules,storage:rules,functions
   ```

Notes
- The security rules rely on custom claims for clinic users (`clinicId`) and on short-lived custom tokens for patient sessions (`patientId`).
- Use Firebase Admin SDK (in Cloud Functions) to mint custom tokens and set claims.
