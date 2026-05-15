// patch-forgot-password.js
// 1. Make the existing password eye icon more visible (text-white/30 -> text-white/60, amber hover)
// 2. Add "Forgot password?" link below password field (Sign In tab only)
//    - Uses Firebase's built-in sendPasswordResetEmail
//    - Reset email routes through your existing Resend setup automatically
//
// Run from D:\projects\NiyamHRAI:
//   node patch-forgot-password.js

const fs = require('fs');
const path = require('path');

const FILE = path.join('src', 'app', 'login', 'page.tsx');
const BACKUP = FILE + '.before-forgot-password';

if (!fs.existsSync(FILE)) {
  console.error('X Cannot find ' + FILE);
  process.exit(1);
}

let content = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const original = content;

// Skip if already patched
if (content.includes('handleForgotPassword')) {
  console.log('Already patched. Aborting.');
  process.exit(0);
}

// ---- 1. Add Firebase auth imports ----
const oldImports = `import { useAuth } from '@/lib/auth-context';`;
const newImports = `import { useAuth } from '@/lib/auth-context';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';`;

if (!content.includes(oldImports)) { console.error('X Could not find auth-context import'); process.exit(1); }
content = content.replace(oldImports, newImports);

// ---- 2. Add reset state vars ----
const oldStates = `  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);`;
const newStates = `  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetSending, setResetSending] = useState(false);`;

if (!content.includes(oldStates)) { console.error('X Could not find state vars'); process.exit(1); }
content = content.replace(oldStates, newStates);

// ---- 3. Add handleForgotPassword function before handleSubmit ----
const oldFuncStart = `  const handleSubmit = async (e: React.FormEvent) => {`;
const newFuncBlock = `  const handleForgotPassword = async () => {
    setError(''); setResetMsg('');
    if (!email.trim()) {
      setError('Enter your email above first.');
      return;
    }
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMsg('Password reset link sent to ' + email.trim() + '. Check your inbox (and spam folder).');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('No account found with this email.');
      else if (code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Please wait a few minutes and try again.');
      else setError(err.message || 'Failed to send reset email.');
    } finally { setResetSending(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {`;

if (!content.includes(oldFuncStart)) { console.error('X Could not find handleSubmit'); process.exit(1); }
content = content.replace(oldFuncStart, newFuncBlock);

// ---- 4. Brighten the eye icon ----
const oldEyeClass = `className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"`;
const newEyeClass = `className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-amber-400 transition-colors"`;

if (!content.includes(oldEyeClass)) { console.error('X Could not find eye icon class'); process.exit(1); }
content = content.replace(oldEyeClass, newEyeClass);

// ---- 5. Insert "Forgot password?" link and reset-success banner ----
// Locate the end of the password div block, just before "{error && ("
const oldErrorMarker = `            </div>
          </div>

          {error && (`;

const newErrorMarker = `              {!isSignUp && !inviteLocked && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetSending}
                    className="text-[11px] sm:text-xs font-bold text-amber-400/80 hover:text-amber-400 transition-colors disabled:opacity-40"
                  >
                    {resetSending ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {resetMsg && (
            <div className="p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl text-emerald-300 text-xs sm:text-sm font-bold mb-5 sm:mb-6">{resetMsg}</div>
          )}

          {error && (`;

if (!content.includes(oldErrorMarker)) { console.error('X Could not find error marker'); process.exit(1); }
content = content.replace(oldErrorMarker, newErrorMarker);

if (content === original) {
  console.error('X No changes made. Aborting.');
  process.exit(1);
}

fs.copyFileSync(FILE, BACKUP);
fs.writeFileSync(FILE, content, 'utf8');

console.log('OK Patched ' + FILE);
console.log('   Backup: ' + BACKUP);
console.log('');
console.log('Changes:');
console.log('  + Imported sendPasswordResetEmail from firebase/auth');
console.log('  + Added handleForgotPassword function');
console.log('  + Eye icon brightened (text-white/30 -> text-white/60, amber hover)');
console.log('  + "Forgot password?" link on Sign In tab');
console.log('  + Green success banner when reset email is sent');
console.log('');
console.log('Deploy:');
console.log('  git add .');
console.log('  git commit -m "feat: forgot password flow and brighter password eye icon"');
console.log('  git push');
