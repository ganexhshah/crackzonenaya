# Authentication & Dashboard Flow

## Complete Authentication System

### 1. **Login Page** (`/auth/login`)
- Email or Phone input
- Password with show/hide toggle
- Remember me checkbox
- Error messages for invalid credentials
- Loading spinner during authentication
- Social login buttons (Google, Facebook)
- Links to forgot password and registration
- **Mobile Responsive**: Full-width on mobile, centered card on desktop

### 2. **Register Page** (`/auth/register`)
- Full name input
- Email or phone input with validation
- Password with strength meter
- Confirm password
- Accept terms checkbox
- Real-time validation:
  - Email format check
  - Password minimum 8 characters
  - Password strength indicator (Weak/Fair/Good/Strong)
  - Passwords match validation
- **Mobile Responsive**: Stacked inputs, full-width buttons

### 3. **OTP Verification** (`/auth/verify-otp`)
- 6-digit OTP input with auto-focus
- Paste support for OTP codes
- Countdown timer (60 seconds)
- Resend OTP button (enabled after countdown)
- Auto-redirect to profile setup on success
- **Mobile Responsive**: Optimized OTP input size for mobile

### 4. **Forgot Password** (`/auth/forgot-password`)
- Email input
- Send reset link button
- Success message with email confirmation
- Back to login link
- **Mobile Responsive**: Full-width card, large touch targets

### 5. **Reset Password** (`/auth/reset-password`)
- New password input with show/hide
- Confirm password input
- Password strength meter
- Password requirements display
- Success message with auto-redirect to login
- **Mobile Responsive**: Stacked layout on mobile

## Profile Setup Flow

### 6. **Profile Setup** (`/profile/setup`)
**Note**: IGN and UID are NOT asked during registration - they're collected here!

- Profile picture upload (max 5MB)
- Camera icon for easy upload
- In-Game Name (IGN) input
- Free Fire UID input (numbers only, 8-12 digits)
- UID validation and helper text
- Skip option available
- Redirects to dashboard on completion
- **Mobi
**Components Used:**
- `Button`, `Card`, `Alert`
- Icons: `Loader2`, `CheckCircle2`

**Flow:** After successful verification → redirects to `/profile/setup`

---

### 4. Forgot Password (`/auth/forgot-password`)
**Features:**
- Email input
- Email format validation
- Send reset link button
- Success screen with confirmation
- Back to login link

**Components Used:**
- `Button`, `Input`, `Label`, `Card`, `Alert`
- Icons: `Mail`, `CheckCircle2`, `ArrowLeft`, `Loader2`

---

### 5. Reset Password (`/auth/reset-password`)
**Features:**
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Password strength meter
- Progress bar showing strength
- Password requirements list
- Form validation
- Success screen with auto-redirect to login

**Components Used:**
- `Button`, `Input`, `Label`, `Card`, `Alert`, `Progress`, `Badge`
- Icons: `Lock`, `Eye`, `EyeOff`, `CheckCircle2`, `Loader2`

---

## 🎮 Profile Setup Page (`/profile/setup`)

**This page is shown AFTER registration and OTP verification**

**Features:**
- Profile picture upload
  - 