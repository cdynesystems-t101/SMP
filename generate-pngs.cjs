const sharp = require('sharp');
const fs = require('fs');

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  
  <g transform="translate(256, 240)" filter="url(#shadow)">
    <!-- Split Circle Icon -->
    <circle cx="-60" cy="-40" r="50" fill="#ffffff" opacity="0.95"/>
    <circle cx="60" cy="-40" r="50" fill="#ffffff" opacity="0.95"/>
    <circle cx="0" cy="65" r="50" fill="#ffffff" opacity="0.95"/>
    
    <!-- Connector Lines -->
    <path d="M-60 -40 L60 -40 L0 65 Z" fill="none" stroke="#ffffff" stroke-width="18" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>
    
    <!-- Currency Dollar Sign Center -->
    <text x="0" y="12" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="76" fill="#4f46e5" text-anchor="middle" dominant-baseline="middle">$</text>
  </g>
  <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="2">SPLITMATE</text>
</svg>
`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  
  <!-- Full bleed square for maskable icon safe area -->
  <rect width="512" height="512" fill="url(#bg)"/>
  
  <g transform="translate(256, 230)">
    <circle cx="-50" cy="-35" r="42" fill="#ffffff" opacity="0.95"/>
    <circle cx="50" cy="-35" r="42" fill="#ffffff" opacity="0.95"/>
    <circle cx="0" cy="55" r="42" fill="#ffffff" opacity="0.95"/>
    <path d="M-50 -35 L50 -35 L0 55 Z" fill="none" stroke="#ffffff" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>
    <text x="0" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#4f46e5" text-anchor="middle" dominant-baseline="middle">$</text>
  </g>
  <text x="256" y="410" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="38" fill="#ffffff" text-anchor="middle" letter-spacing="2">SPLITMATE</text>
</svg>
`;

const wideScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <rect width="1280" height="720" fill="#0f172a"/>
  
  <!-- Header Bar -->
  <rect width="1280" height="64" fill="#1e293b"/>
  <circle cx="40" cy="32" r="18" fill="#4f46e5"/>
  <text x="70" y="38" font-family="sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">SplitMate Pro - Multi-Currency Splitter</text>
  
  <!-- Dashboard Cards -->
  <rect x="40" y="96" width="360" height="180" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="70" y="136" font-family="sans-serif" font-size="16" fill="#94a3b8">Total Group Balance</text>
  <text x="70" y="180" font-family="sans-serif" font-weight="bold" font-size="36" fill="#10b981">+$240.50</text>
  <text x="70" y="220" font-family="sans-serif" font-size="14" fill="#64748b">3 Pending Settlements</text>

  <rect x="440" y="96" width="360" height="180" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="470" y="136" font-family="sans-serif" font-size="16" fill="#94a3b8">Trip Currency</text>
  <text x="470" y="180" font-family="sans-serif" font-weight="bold" font-size="36" fill="#f8fafc">EUR (€)</text>
  <text x="470" y="220" font-family="sans-serif" font-size="14" fill="#64748b">Auto FX Rates Active</text>

  <rect x="840" y="96" width="400" height="180" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="870" y="136" font-family="sans-serif" font-size="16" fill="#94a3b8">Optimal Settlements</text>
  <text x="870" y="176" font-family="sans-serif" font-weight="bold" font-size="20" fill="#6366f1">Alex pays Sam €45.00</text>
  <text x="870" y="212" font-family="sans-serif" font-size="14" fill="#cbd5e1">Minimizes transfers from 8 to 2</text>

  <!-- Expense List -->
  <rect x="40" y="300" width="1200" height="380" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="70" y="345" font-family="sans-serif" font-weight="bold" font-size="22" fill="#f8fafc">Recent Group Expenses</text>
  
  <line x1="70" y1="370" x2="1210" y2="370" stroke="#334155" stroke-width="1"/>
  <text x="70" y="415" font-family="sans-serif" font-weight="600" font-size="18" fill="#f8fafc">Dinner at Trattoria</text>
  <text x="70" y="440" font-family="sans-serif" font-size="14" fill="#94a3b8">Paid by Sarah • Split equally</text>
  <text x="1100" y="425" font-family="sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">€120.00</text>

  <line x1="70" y1="470" x2="1210" y2="470" stroke="#334155" stroke-width="1"/>
  <text x="70" y="515" font-family="sans-serif" font-weight="600" font-size="18" fill="#f8fafc">Museum Tickets &amp; Tour</text>
  <text x="70" y="540" font-family="sans-serif" font-size="14" fill="#94a3b8">Paid by Alex • 4 people</text>
  <text x="1100" y="525" font-family="sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">€85.50</text>

  <line x1="70" y1="570" x2="1210" y2="570" stroke="#334155" stroke-width="1"/>
  <text x="70" y="615" font-family="sans-serif" font-weight="600" font-size="18" fill="#f8fafc">Airport Express Train</text>
  <text x="70" y="640" font-family="sans-serif" font-size="14" fill="#94a3b8">Paid by You • Split by percentage</text>
  <text x="1100" y="625" font-family="sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">€36.00</text>
</svg>
`;

const narrowScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1334" width="750" height="1334">
  <rect width="750" height="1334" fill="#0f172a"/>
  
  <!-- Header -->
  <rect width="750" height="120" fill="#1e293b"/>
  <circle cx="80" cy="60" r="32" fill="#4f46e5"/>
  <text x="135" y="70" font-family="sans-serif" font-weight="bold" font-size="34" fill="#f8fafc">SplitMate Pro</text>
  
  <!-- Summary Cards -->
  <rect x="40" y="160" width="670" height="220" rx="24" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="80" y="220" font-family="sans-serif" font-size="26" fill="#94a3b8">Your Net Balance</text>
  <text x="80" y="290" font-family="sans-serif" font-weight="bold" font-size="54" fill="#10b981">+$142.00</text>
  <text x="80" y="340" font-family="sans-serif" font-size="22" fill="#64748b">2 people owe you</text>

  <!-- Optimal Settle Banner -->
  <rect x="40" y="410" width="670" height="180" rx="24" fill="#312e81" stroke="#4338ca" stroke-width="2"/>
  <text x="80" y="470" font-family="sans-serif" font-weight="bold" font-size="28" fill="#e0e7ff">Minimum Cash Flow Math</text>
  <text x="80" y="520" font-family="sans-serif" font-size="24" fill="#c7d2fe">Settles trip in 2 payments instead of 7</text>

  <!-- Recent Expenses List -->
  <text x="50" y="650" font-family="sans-serif" font-weight="bold" font-size="32" fill="#f8fafc">Recent Expenses</text>
  
  <rect x="40" y="680" width="670" height="160" rx="20" fill="#1e293b"/>
  <text x="80" y="740" font-family="sans-serif" font-weight="bold" font-size="28" fill="#f8fafc">Taxi to Hotel</text>
  <text x="80" y="780" font-family="sans-serif" font-size="22" fill="#94a3b8">Paid by John • $45.00</text>
  
  <rect x="40" y="860" width="670" height="160" rx="20" fill="#1e293b"/>
  <text x="80" y="920" font-family="sans-serif" font-weight="bold" font-size="28" fill="#f8fafc">Groceries &amp; Snacks</text>
  <text x="80" y="960" font-family="sans-serif" font-size="22" fill="#94a3b8">Paid by You • $88.20</text>

  <rect x="40" y="1040" width="670" height="160" rx="20" fill="#1e293b"/>
  <text x="80" y="1100" font-family="sans-serif" font-weight="bold" font-size="28" fill="#f8fafc">Beach Resort Passes</text>
  <text x="80" y="1140" font-family="sans-serif" font-size="22" fill="#94a3b8">Paid by Emma • $120.00</text>
</svg>
`;

async function generateAll() {
  console.log('Generating crisp PNG assets with sharp...');
  
  const iconBuffer = Buffer.from(iconSvg);
  const maskableBuffer = Buffer.from(maskableSvg);
  const wideBuffer = Buffer.from(wideScreenshotSvg);
  const narrowBuffer = Buffer.from(narrowScreenshotSvg);

  fs.writeFileSync('public/icon.svg', iconSvg);

  await sharp(iconBuffer)
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toFile('public/icon-192.png');

  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile('public/icon-512.png');

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile('public/maskable-icon-512.png');

  await sharp(iconBuffer)
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile('public/apple-touch-icon.png');

  await sharp(wideBuffer)
    .resize(1280, 720)
    .png({ compressionLevel: 9 })
    .toFile('public/screenshot-wide.png');

  await sharp(narrowBuffer)
    .resize(750, 1334)
    .png({ compressionLevel: 9 })
    .toFile('public/screenshot-narrow.png');

  console.log('All public PNG assets regenerated successfully!');
}

generateAll().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
