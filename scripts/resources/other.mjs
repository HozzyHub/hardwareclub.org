// Interactive tools, local directory, and downloads. Tool logic lives in
// public/tools.js (CSP forbids inline scripts); the pages here carry the form
// markup plus a static no-JS fallback.

const select = (id, label, options) => `
      <div class="field">
        <label for="${id}">${label}</label>
        <select id="${id}" name="${id}">
          ${options.map(([v, t]) => `<option value="${v}">${t}</option>`).join("\n          ")}
        </select>
      </div>`;

export const tools = [
  {
    url: "/resources/donate-or-recycle",
    crumb: "Donate, repair, or recycle?",
    title: "Donate, repair, or recycle? A quick decision tool",
    description:
      "Answer a few questions about an old device and get a plain recommendation: keep using it, repair it, donate it to Hardware Club, or take it to a recycler.",
    eyebrow: "Tool",
    h1: "Donate, repair, or recycle?",
    lede: "Tell us about the device. The answer appears below and nothing you choose leaves your browser.",
    script: "/tools.js",
    body: `
    <form id="triage-form" class="tool-form" data-tool="triage">
      ${select("device", "What is it?", [
        ["laptop", "Laptop"],
        ["desktop", "Desktop or all-in-one"],
        ["server", "Server or workstation"],
        ["mobile", "Phone or tablet"],
        ["parts", "Parts, cables, memory or drives"],
        ["other", "TV, CRT monitor, printer or appliance"],
      ])}
      ${select("power", "Does it work?", [
        ["works", "Yes, works fine"],
        ["issues", "Powers on, but something is wrong"],
        ["dead", "Doesn't power on"],
      ])}
      ${select("age", "How old is it?", [
        ["new", "Under 5 years"],
        ["mid", "5 to 10 years"],
        ["old", "Over 10 years"],
      ])}
      <label class="checkbox-single"><input type="checkbox" id="swollen" name="swollen"> <span>The battery is swollen, bulging, leaking or very hot</span></label>
      <button class="visually-hidden" type="submit">Show recommendation</button>
    </form>
    <div id="triage-result" class="tool-result" role="status" aria-live="polite" hidden></div>
    <noscript>
      <div class="note-card">This tool needs JavaScript. In short: swollen batteries, TVs, CRTs, printers and appliances go to a drop-off listed in the <a href="/resources/local-directory">directory</a>; working or broken laptops, desktops, servers, phones and parts can be <a href="/#donate">offered to Hardware Club</a>.</div>
    </noscript>
    <p class="muted-text">This is general guidance. If you're unsure, <a href="/#donate">send us the details</a> and we'll tell you honestly.</p>`,
  },
  {
    url: "/resources/wipe-method-picker",
    crumb: "Data-wipe method picker",
    title: "Data-wipe method picker: how to erase your device",
    description:
      "Pick your device and drive type and get the right steps for erasing it before you donate, sell or recycle it.",
    eyebrow: "Tool",
    h1: "Data-wipe method picker",
    lede: "Choose your device to see exactly how to erase it. Runs entirely in your browser.",
    script: "/tools.js",
    body: `
    <form id="wipe-form" class="tool-form" data-tool="wipe">
      ${select("wdevice", "Device", [
        ["windows", "Windows PC or laptop"],
        ["mac", "Mac"],
        ["iphone", "iPhone or iPad"],
        ["android", "Android phone or tablet"],
        ["chromebook", "Chromebook"],
        ["linux", "Linux PC"],
      ])}
      ${select("wdrive", "Drive type (computers only)", [
        ["unknown", "I'm not sure"],
        ["ssd", "SSD or NVMe"],
        ["hdd", "Spinning hard disk"],
      ])}
      <label class="checkbox-single"><input type="checkbox" id="wbroken" name="wbroken"> <span>It won't power on or the drive can't be read</span></label>
      <button class="visually-hidden" type="submit">Show recommendation</button>
    </form>
    <div id="wipe-result" class="tool-result" role="status" aria-live="polite" hidden></div>
    <noscript>
      <div class="note-card">This tool needs JavaScript. The <a href="/resources/wipe-a-drive-before-donating">wipe guide</a> and the <a href="/resources/downloads">cheat sheet</a> cover every device type.</div>
    </noscript>
    <p class="muted-text">Not sure which drive you have? See <a href="/resources/find-your-computer-specs">how to find your computer's specs</a>. Full background in the <a href="/resources/wipe-a-drive-before-donating">wipe guide</a>.</p>`,
  },
];

const link = (href, text, note) =>
  `<li><a href="${href}" rel="noopener">${text}</a> <span class="muted-text">${note}</span></li>`;

export const directory = {
  url: "/resources/local-directory",
  crumb: "Local directory",
  title: "Metro Detroit e-waste, battery and repair directory",
  description:
    "Where to take electronics, batteries and repair questions in Metro Detroit, with links to official locators and local government pages.",
  eyebrow: "Directory · Metro Detroit",
  h1: "Where to take it in Metro Detroit",
  lede: "Programs and hours change, so this directory links to official locators and local governments instead of listing addresses that go stale.",
  body: `
    <h2>Find a drop-off</h2>
    <ul class="link-list">
      ${link("https://search.earth911.com/", "Earth911 recycling search", "Search by item and ZIP code for nearby recyclers.")}
      ${link("https://www.call2recycle.org/locator/", "Call2Recycle battery locator", "Free battery drop-off locations. Call ahead about damaged batteries.")}
      ${link("https://www.epa.gov/recycle/electronics-donation-and-recycling", "EPA: electronics donation and recycling", "Overview of donating and recycling electronics, plus manufacturer take-back programs.")}
    </ul>

    <h2>Local and state government</h2>
    <p>Counties and cities run household hazardous waste days, e-waste events and drop-off sites. Search each site for "electronics", "e-waste" or "household hazardous waste".</p>
    <ul class="link-list">
      ${link("https://www.waynecounty.com/", "Wayne County", "")}
      ${link("https://www.oakgov.com/", "Oakland County", "")}
      ${link("https://www.macombgov.org/", "Macomb County", "")}
      ${link("https://detroitmi.gov/", "City of Detroit", "")}
      ${link("https://www.michigan.gov/egle", "Michigan EGLE (state environment department)", "Statewide rules and recycling program information.")}
    </ul>

    <h2>Repair and know-how</h2>
    <ul class="link-list">
      ${link("https://www.ifixit.com/", "iFixit", "Free repair guides and teardowns for phones, laptops and more.")}
      ${link("https://www.digitalinclusion.org/", "National Digital Inclusion Alliance", "Directory of groups working on affordable devices and digital skills.")}
    </ul>

    <h2>Manufacturer take-back</h2>
    <p>Many computer and phone makers run mail-in or in-store take-back programs. Search the maker's site for "recycling" or "trade-in", and wipe your data first (see the <a href="/resources/wipe-a-drive-before-donating">wipe guide</a>).</p>

    <aside class="note-card">
      <strong>Know a good local program?</strong> Email <a href="mailto:hello@hardwareclub.org?subject=Directory%20suggestion">hello@hardwareclub.org</a> with the name and link and we'll consider adding it. Hardware Club isn't affiliated with, and doesn't endorse or guarantee, the organizations linked here.
    </aside>
    <p><a href="/resources">&larr; All resources</a></p>`,
};

export const downloadsPage = {
  url: "/resources/downloads",
  crumb: "Downloads",
  title: "Free printable checklists and templates",
  description:
    "Free downloads: a donation prep checklist, a refurbished-buying checklist, a data-wipe cheat sheet and a device inventory spreadsheet.",
  eyebrow: "Downloads",
  h1: "Printable checklists and templates",
  lede: "Plain text and CSV files that open anywhere and print cleanly. Free to share and reuse.",
  body: `
    <ul class="download-list">
      <li><a href="/downloads/hardwareclub-donation-prep-checklist.txt" download><strong>Donation prep checklist</strong></a><span class="muted-text">Everything to do before handing over a computer (.txt)</span></li>
      <li><a href="/downloads/hardwareclub-wipe-cheatsheet.txt" download><strong>Data-wipe cheat sheet</strong></a><span class="muted-text">Erase steps by device type (.txt)</span></li>
      <li><a href="/downloads/hardwareclub-refurb-buying-checklist.txt" download><strong>Refurbished buying checklist</strong></a><span class="muted-text">What to ask and test before and after you buy (.txt)</span></li>
      <li><a href="/downloads/hardwareclub-device-inventory.csv" download><strong>Device inventory spreadsheet</strong></a><span class="muted-text">Template for clearing out an office or closet (.csv, opens in any spreadsheet app)</span></li>
    </ul>
    <aside class="note-card">Each checklist matches a guide on this site: <a href="/resources/prepare-a-laptop-for-donation">preparing a laptop</a>, <a href="/resources/wipe-a-drive-before-donating">wiping a drive</a> and <a href="/resources/buying-refurbished-hardware">buying refurbished</a>.</aside>
    <p><a href="/resources">&larr; All resources</a></p>`,
};

export const downloadFiles = [
  {
    file: "hardwareclub-donation-prep-checklist.txt",
    content: `HARDWARE CLUB: DONATION PREP CHECKLIST
hardwareclub.org/resources/prepare-a-laptop-for-donation

Device: ______________________  Model: ______________________

[ ] Back up everything I want to keep, and check the copy opens
      (hardwareclub.org/resources/back-up-before-you-donate)
[ ] Moved two-factor (authenticator) codes to another device, and
    signed in once with them
[ ] Signed out of accounts (Apple ID / Find My, Google, Microsoft)
[ ] Removed firmware or BIOS password
[ ] Erased the device, or removed the drive to keep
      (hardwareclub.org/resources/wipe-a-drive-before-donating)
[ ] Removed SIM and memory cards
[ ] Found the charger or power adapter
[ ] Tested: powers on / battery holds charge / screen / keyboard /
    trackpad / Wi-Fi / ports
[ ] Wrote down what is broken
[ ] Noted make, model, memory, storage, and approximate age
      (hardwareclub.org/resources/find-your-computer-specs)
[ ] Battery is NOT swollen, bulging or leaking
    (if it is, do not bring it: hardwareclub.org/resources/batteries-and-e-waste-safety)
[ ] Removed personal stickers, tags and items stored inside
[ ] Packed safely
[ ] Submitted the donation form: hardwareclub.org/#donate

We do not accept: CRT monitors and TVs, printers, kitchen and household
appliances, loose or swollen batteries.

Hardware Club is an independent project, not a nonprofit. Donations are not
tax-deductible.
`,
  },
  {
    file: "hardwareclub-wipe-cheatsheet.txt",
    content: `HARDWARE CLUB: DATA-WIPE CHEAT SHEET
hardwareclub.org/resources/wipe-a-drive-before-donating

ALWAYS FIRST: back up, then sign out of accounts. Menu names vary by version.

WINDOWS 10/11
  Settings > System > Recovery > Reset this PC > Remove everything.
  Choose the option to clean the drive if offered.
  SSD: turn on device encryption / BitLocker first, then reset.

MAC
  Sign out of iCloud and turn off Find My.
  Apple silicon or T2 Mac (macOS Monterey or later):
    System Settings > General > Transfer or Reset > Erase All Content and Settings.
  Older Intel Macs: restart into Recovery, erase the disk in Disk Utility, reinstall macOS.

IPHONE / IPAD
  Turn off Find My, sign out of Apple ID.
  Settings > General > Transfer or Reset > Erase All Content and Settings.

ANDROID
  Remove Google account first (avoids Factory Reset Protection lockout).
  Settings > System > Reset options > Erase all data (factory reset).
  Remove SIM and SD cards.

CHROMEBOOK
  Sign out, then Settings > Reset settings > Powerwash.
  Remove from any school or work management first.

LINUX / ANY PC WITH A HARD DISK (HDD)
  Boot a live USB with nwipe and run a one-pass zero overwrite.

LINUX / ANY PC WITH AN SSD OR NVMe
  Use the maker's secure-erase tool, or the drive's sanitize command.
  Do not rely on multi-pass overwrites.

WON'T POWER ON / DRIVE UNREADABLE
  Remove the drive and keep it, or destroy it physically.

Reference: NIST SP 800-88 Rev. 1 (csrc.nist.gov/pubs/sp/800/88/r1/final)
`,
  },
  {
    file: "hardwareclub-refurb-buying-checklist.txt",
    content: `HARDWARE CLUB: REFURBISHED BUYING CHECKLIST
hardwareclub.org/resources/buying-refurbished-hardware

ASK THE SELLER
[ ] Return window? Warranty? Who honors it?
[ ] What does the condition grade mean, in writing?
[ ] Battery replaced or tested? What capacity?
[ ] Drive securely wiped, fresh OS installed?
[ ] Free of account locks, firmware passwords, management profiles?
[ ] Photos of the actual item?

SPECS WORTH PAYING FOR
[ ] SSD
[ ] 8 GB memory or more (16 GB for heavy multitasking)
[ ] Recent processor your target OS supports
[ ] Business-class model (often sturdier, easier to repair)

TEST IN THE FIRST WEEK
[ ] Screen: dead pixels, discoloration, brightness
[ ] Keyboard, trackpad, ports, speakers, mic, camera
[ ] Battery report and charging
[ ] Storage health (SMART) and a full memory test
[ ] Specs in system info match the listing

RED FLAGS
- No returns or vague "as is" language
- Price far below similar listings
- Seller cannot say whether the device is locked to another account
`,
  },
  {
    file: "hardwareclub-device-inventory.csv",
    content: `Item,Type,Make,Model,Age (years),Works (yes/partly/no),Memory,Storage,Charger included (yes/no),Drive wiped or removed,Notes
`,
  },
];
