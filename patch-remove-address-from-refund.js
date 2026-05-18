// patch-remove-address-from-refund.js
// Removes physical address and business hours from refund-cancellation contact section
// Per user privacy request: only email contact to remain publicly visible

const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'app', 'refund-cancellation', 'page.tsx');

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  console.error('   Run this from D:\\projects\\NiyamHRAI');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const oldContactBlock = `          <Section title="10. Contact">
            <p>For any questions regarding refunds, cancellations, or data handling:</p>
            <div className="mt-4 space-y-2 pl-4 border-l-2 border-amber-500/40">
              <p>
                <strong className="text-white">Email:</strong>{' '}
                <a
                  href="mailto:support@niyamhr.in"
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  support@niyamhr.in
                </a>
              </p>
              <p>
                <strong className="text-white">Address:</strong> SmartDNA Business Intelligence
                &amp; Advisory, Flat-G Balaji Shree Apart, 40-41 6th Main Road, RA, Chennai,
                Tamil Nadu 600028, India
              </p>
              <p>
                <strong className="text-white">Business Hours:</strong> Monday–Friday, 10:00 AM
                – 6:00 PM IST
              </p>
            </div>
          </Section>`;

const newContactBlock = `          <Section title="10. Contact">
            <p>For any questions regarding refunds, cancellations, or data handling, please email us:</p>
            <div className="mt-6 pl-4 border-l-2 border-amber-500/40">
              <a
                href="mailto:support@niyamhr.in"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 text-lg font-medium"
              >
                support@niyamhr.in
              </a>
            </div>
            <p className="mt-4 text-stone-500 text-sm">
              We aim to respond to all inquiries within 2 business days. Our registered business
              address and full contact details are available on request to verified customers.
            </p>
          </Section>`;

if (!content.includes(oldContactBlock)) {
  console.error('❌ Contact block not found in expected format.');
  console.error('   The file may have been edited since the original patch was applied.');
  console.error('   Paste the current contents of src/app/refund-cancellation/page.tsx to Claude.');
  process.exit(1);
}

content = content.replace(oldContactBlock, newContactBlock);
fs.writeFileSync(filePath, content);

console.log('✓ Removed address and business hours from contact section');
console.log('✓ Only email visible; address available on request to verified customers');
console.log('');

// Also clean up the old patch script from the repo if it still exists
const oldPatchScript = 'patch-refund-cancellation.js';
if (fs.existsSync(oldPatchScript)) {
  fs.unlinkSync(oldPatchScript);
  console.log('✓ Removed old patch-refund-cancellation.js from working directory');
}

console.log('');
console.log('NEXT STEPS:');
console.log('  1. git add -A                  (stages all changes including file deletions)');
console.log('  2. git commit -m "privacy: remove physical address from refund policy"');
console.log('  3. git push                    (auto-deploys via Firebase App Hosting)');
console.log('  4. Verify at: https://niyamhr.in/refund-cancellation');
console.log('  5. Remove-Item patch-remove-address-from-refund.js');
