# TaskFlow (no backend needed)

Same TaskFlow design. Everything is saved **on the device** (AsyncStorage + the app's file folder), so there is nothing to set up.

- **Create account / log in** – passwords are salted + hashed (SHA-256) before saving
- **Forgot password** – enter your email, get a 6-digit code, enter it, choose a new password
- **Dashboard** – overall progress, most-priority tasks, upcoming deadlines
- **Tasks** – title, description, priority, deadline, members (search existing accounts)
- **Progress** – per-task 0/25/50/75/100%, status breakdown, progress by priority
- **Deadlines** – overdue / today / next 7 days / later
- **Files** – upload to a task, open, delete

## Run

```bash
npm install
npx expo start        # w = web, or scan the QR code with Expo Go
```

## Good to know

- Data lives only on the phone/browser that created it; it is not synced between devices or between different people.
- **Forgot password:** with no email server the app cannot send email, so the code is shown on screen. To send real emails you need a server (e.g. EmailJS, Resend, or your own API); the only place to change is `requestPasswordReset` in `lib/auth.tsx`.
- Members are picked by searching the accounts created on this device. A member sees the task when they log in, can update progress and upload files; only the owner can add/remove members or delete the task.
- On the web, uploaded files last until the page is closed; on phones they are copied into the app's storage and stay.
