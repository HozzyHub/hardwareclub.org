// Written guides. Each: slug, crumb, title, h1, description, lede, card, level, body (HTML).
export const guides = [
  {
    slug: "wipe-a-drive-before-donating",
    crumb: "Wipe a drive",
    title: "How to wipe a hard drive or SSD before donating",
    h1: "How to wipe a drive before you donate it",
    level: "Beginner",
    description:
      "A plain-language guide to erasing a laptop, desktop, phone or tablet before it leaves your hands: what works on hard drives vs SSDs, and when to destroy a drive instead.",
    lede: "Deleting files or emptying the trash does not erase anything. Here is what actually does, by drive type.",
    card: "What really erases data on hard drives, SSDs, phones and tablets, and when to destroy a drive instead.",
    body: `
    <h2>Step 0: back up what you want to keep</h2>
    <p>Wiping is permanent. Copy photos, documents, browser bookmarks and password-manager exports to an external drive or cloud account first, and check the copy opens. The <a href="/resources/back-up-before-you-donate">backup guide</a> has a full checklist, including two-factor codes.</p>

    <h2>Step 1: sign out and deauthorize</h2>
    <ul>
      <li><strong>Apple devices:</strong> turn off Find My and sign out of your Apple ID. A device still tied to your account (Activation Lock) is very hard for anyone else to use.</li>
      <li><strong>Android and Chromebooks:</strong> remove your Google account before resetting, otherwise Factory Reset Protection can lock the next owner out.</li>
      <li><strong>Windows:</strong> sign out of your Microsoft account and deauthorize paid software (Adobe, music libraries, games) that limits installs.</li>
      <li>Remove SIM and memory cards, and remove any BIOS/UEFI or firmware password.</li>
    </ul>

    <h2>Step 2: pick the method for your drive</h2>
    <div class="table-wrap"><table>
      <thead><tr><th scope="col">Drive</th><th scope="col">Good enough for donating</th><th scope="col">Extra careful</th></tr></thead>
      <tbody>
        <tr><th scope="row">Hard disk (HDD, spinning)</th><td>One full overwrite pass with zeros, using the built-in reset with "clean the drive", or a tool such as the open-source <a href="https://github.com/martijnvanbrummelen/nwipe">nwipe</a>.</td><td>Physical destruction if the drive held especially sensitive data or no longer works.</td></tr>
        <tr><th scope="row">SSD / NVMe</th><td>Turn on full-disk encryption, then reset the device (the encryption key is discarded, so what's left is unreadable), or run the maker's secure-erase tool.</td><td>Firmware "sanitize" or "secure erase" commands. Avoid multi-pass overwrite tools: they don't reliably reach every cell on an SSD.</td></tr>
        <tr><th scope="row">Phone / tablet</th><td>Sign out of accounts, then "Erase all content and settings" or a factory reset. These devices encrypt storage by default.</td><td>Encrypt first (older Android), then reset.</td></tr>
        <tr><th scope="row">Won't power on or can't be read</th><td>Pull the drive and keep it, or hand it to us separately.</td><td>Physical destruction.</td></tr>
      </tbody>
    </table></div>
    <p>The reference for this is <a href="https://csrc.nist.gov/pubs/sp/800/88/r1/final">NIST SP 800-88 Rev. 1</a>, which describes "clear", "purge" and "destroy" levels. For ordinary personal data, "clear" (a full overwrite or an encrypted reset) is the sensible level.</p>

    <h2>Step 3: check it worked</h2>
    <p>After the reset, the device should boot to a first-time setup screen with no trace of your account. If you wiped a drive with a tool, try to open it: it should show as empty or unformatted.</p>

    <h2>Prefer to keep the drive?</h2>
    <p>If you'd rather not trust any software, take the drive out and keep it. Hardware Club will take the machine without it, and you can say so on the donation form. Tell us you want your drive back and we'll hand it over at drop-off.</p>
    <p>Not sure which steps apply to your device? Use the <a href="/resources/wipe-method-picker">data-wipe method picker</a>.</p>`,
  },
  {
    slug: "back-up-before-you-donate",
    crumb: "Back up first",
    title: "Back up an old computer or phone before donating",
    h1: "Back up an old computer or phone before you let it go",
    level: "Beginner",
    description:
      "What to copy off an old laptop, desktop or phone before wiping it (photos, documents, passwords, two-factor codes, messages), where to put it, and how to check the copy works.",
    lede: "Wiping is permanent. Fifteen minutes spent checking what's on the device, and that your copy opens, saves a lot of regret.",
    card: "What to copy off before a wipe: photos, files, passwords, 2FA codes and messages, and how to check the copy.",
    body: `
    <h2>Make a list of what's on it</h2>
    <p>Most people remember photos and documents and forget the rest. Go through this list before you start:</p>
    <ul>
      <li><strong>Photos and videos</strong>, including any outside the main Pictures folder (Downloads, Desktop, phone camera roll).</li>
      <li><strong>Documents</strong>: Desktop, Documents and Downloads folders, and anything saved inside an app's own folder.</li>
      <li><strong>Passwords</strong> saved in the browser or a password manager.</li>
      <li><strong>Two-factor authentication codes.</strong> If an authenticator app on an old phone is the only place your codes live, move them to the new phone and check you can sign in <em>before</em> you reset the old one. Losing them can lock you out of accounts.</li>
      <li><strong>Messages</strong> you want to keep (texts, chat apps), and <strong>browser bookmarks</strong>.</li>
      <li><strong>Licence keys</strong> for paid software, and anything you need to deauthorize (music libraries, design software, games).</li>
      <li><strong>Email</strong> stored only on the device (an old Outlook data file, for example) rather than on the mail server.</li>
    </ul>

    <h2>Pick where the copy goes</h2>
    <ul>
      <li><strong>An external drive or USB stick</strong> is simple and needs no account. Copy the folders across, and keep the drive somewhere safe.</li>
      <li><strong>A cloud account</strong> you already use (iCloud, Google, OneDrive) works well for phones and for photos. Check that the backup finished and that you have room for it.</li>
      <li><strong>Moving to a new device?</strong> The built-in transfer tools (Quick Start on iPhone, Migration Assistant on Mac, the Android setup copy step, or signing in with the same account on Windows) carry over much of this list for you.</li>
    </ul>
    <p>For anything irreplaceable, keep two copies in different places, for example an external drive and a cloud account.</p>

    <h2>Phones: a few extra steps</h2>
    <ul>
      <li><strong>iPhone and iPad:</strong> back up to iCloud (Settings &gt; your name &gt; iCloud &gt; iCloud Backup) or to a computer.</li>
      <li><strong>Android:</strong> Settings &gt; Google &gt; Backup (menu names vary by maker). Photos back up separately through your photos app.</li>
      <li>Chat apps often keep their own backup setting (WhatsApp and Signal, for example). Check it inside the app.</li>
    </ul>

    <h2>Check the copy before you wipe</h2>
    <ol>
      <li>Open a few photos and documents <em>from the copy</em>, not from the old device.</li>
      <li>On the new device, sign in to your password manager and one account that uses two-factor authentication.</li>
      <li>Only then follow the <a href="/resources/wipe-a-drive-before-donating">wipe guide</a>, or the <a href="/resources/wipe-method-picker">wipe method picker</a> for your device.</li>
    </ol>

    <h2>Can't get it to turn on?</h2>
    <p>The data is usually still on the drive. Take the drive out and keep it, or tell us on the <a href="/#donate">donation form</a> that you want your drive back. With an inexpensive USB adapter or enclosure, you can copy files off it later from another computer.</p>`,
  },
  {
    slug: "prepare-a-laptop-for-donation",
    crumb: "Prepare a laptop",
    title: "How to prepare a laptop or desktop for donation",
    h1: "Get a laptop or desktop ready to donate",
    level: "Beginner",
    description:
      "A short checklist for donating a computer: what to include, what to remove, how to describe its condition, and what makes it far more useful to the next person.",
    lede: "Ten minutes of prep makes a donated computer much easier to put back to work.",
    card: "A ten-minute checklist: accounts, chargers, condition notes, and what to leave out.",
    body: `
    <h2>Before you hand it over</h2>
    <ol>
      <li><strong>Back up</strong> anything you want to keep, including two-factor codes. See the <a href="/resources/back-up-before-you-donate">backup guide</a>.</li>
      <li><strong>Sign out and wipe.</strong> Follow the <a href="/resources/wipe-a-drive-before-donating">wipe guide</a>, or tell us you want your drive back.</li>
      <li><strong>Find the charger.</strong> A working power adapter is often the difference between a usable laptop and a parts machine. Check you have the right one for that model.</li>
      <li><strong>Test it.</strong> Does it power on? Does it hold a charge? Does the screen, keyboard, trackpad and Wi-Fi work? Jot down what doesn't.</li>
      <li><strong>Note the specs.</strong> Make, model, memory, storage and roughly how old it is. The label on the bottom or the "About" page has most of it.</li>
      <li><strong>Remove personal items:</strong> stickers with your name, asset tags, adhesive residue, and anything stored inside the case.</li>
      <li><strong>Pack it safely.</strong> A padded bag or a box with something soft around it is plenty. Keep the battery in the laptop unless it is swollen (see the <a href="/resources/batteries-and-e-waste-safety">battery guide</a>).</li>
    </ol>

    <h2>What to tell us in the donation form</h2>
    <ul>
      <li>What it is and roughly how many you have.</li>
      <li>Whether it powers on, and anything that's broken. Broken laptops, desktops and servers are welcome.</li>
      <li>Whether you want a drive returned to you.</li>
    </ul>
    <p>The <a href="/resources/downloads">printable donation checklist</a> and <a href="/resources/downloads">inventory spreadsheet</a> help if you're clearing out an office or a closet full of gear.</p>

    <h2>What we can't take</h2>
    <p>CRT monitors and TVs, printers, kitchen and household appliances, and loose or swollen batteries. The <a href="/resources/local-directory">local directory</a> lists where those can go instead.</p>`,
  },
  {
    slug: "find-your-computer-specs",
    crumb: "Find your specs",
    title: "Find your computer's model, RAM and drive type",
    h1: "Find your computer's model, memory and drive type",
    level: "Beginner",
    description:
      "Where to find the model number, processor, RAM, storage size and whether the drive is an SSD or hard disk on Windows, Mac, Chromebook, Linux, phones and tablets.",
    lede: "The model, memory and drive type decide how to wipe a device, whether an upgrade is worth it, and what it's worth to the next person. Here's where to look.",
    card: "Model number, RAM, storage and SSD vs hard disk, on every common system, in a couple of minutes.",
    body: `
    <h2>If it won't turn on: read the label</h2>
    <p>Laptops usually have a sticker or printed text on the underside (sometimes under the battery); desktops on the back or side of the case; phones and tablets in the SIM tray or on the box. Look for "Model", "MTM", "P/N" or "Type". Searching that model number plus "specs" usually finds the original memory, storage and drive type.</p>
    <p>The serial number is on the same label. It identifies your exact unit, so you don't need to post it anywhere public.</p>

    <h2>Windows 10 and 11</h2>
    <ul>
      <li><strong>Model, processor and memory:</strong> Settings &gt; System &gt; About. "Installed RAM" is the memory; the model name is shown at the top on most machines.</li>
      <li><strong>SSD or hard disk:</strong> open Task Manager (Ctrl + Shift + Esc), choose Performance, and select each Disk. The drive type (SSD or HDD) is shown under the graph.</li>
      <li><strong>Storage size:</strong> Settings &gt; System &gt; Storage.</li>
    </ul>

    <h2>Mac</h2>
    <ul>
      <li><strong>Model, chip and memory:</strong> Apple menu &gt; About This Mac. On recent macOS versions, choose More Info for the full details.</li>
      <li><strong>Drive type:</strong> every Mac with Apple silicon, and most Macs from the last several years, uses an SSD. To check, hold Option, open the Apple menu and choose System Information, then look under Storage for "Medium Type".</li>
    </ul>

    <h2>Chromebook</h2>
    <ul>
      <li><strong>Model and update date:</strong> Settings &gt; About ChromeOS &gt; Additional details. The "Update schedule" line tells you how long it keeps getting security updates.</li>
      <li><strong>Drive type:</strong> Chromebooks use flash storage, so treat them as SSD devices. A Powerwash is the right way to erase them.</li>
    </ul>

    <h2>Linux</h2>
    <p>In a terminal:</p>
    <ul>
      <li><code>lsblk -d -o NAME,SIZE,ROTA,MODEL</code> lists each drive. <code>ROTA</code> 1 means a spinning hard disk, 0 means an SSD or NVMe drive.</li>
      <li><code>free -h</code> shows memory and <code>lscpu</code> shows the processor.</li>
      <li><code>cat /sys/class/dmi/id/product_name</code> usually shows the model.</li>
    </ul>

    <h2>Phones and tablets</h2>
    <ul>
      <li><strong>iPhone and iPad:</strong> Settings &gt; General &gt; About shows the model name and capacity.</li>
      <li><strong>Android:</strong> Settings &gt; About phone (or About tablet). Menu names vary by maker.</li>
      <li>Phones and tablets all use flash storage; a factory reset after signing out is the right way to erase them.</li>
    </ul>

    <h2>What to do with it</h2>
    <ul>
      <li>Knowing the drive type? Use the <a href="/resources/wipe-method-picker">data-wipe method picker</a> for the right erase steps.</li>
      <li>Thinking about an upgrade? The <a href="/resources/upgrade-ram-and-ssd">RAM and SSD guide</a> explains what to buy.</li>
      <li>Donating? Put the model, memory and storage in the description on the <a href="/#donate">donation form</a>. It helps us plan where the machine can go.</li>
    </ul>`,
  },
  {
    slug: "repair-or-replace-old-computer",
    crumb: "Repair or replace",
    title: "Should you repair, upgrade or replace an old computer?",
    h1: "Repair, upgrade or replace?",
    level: "Beginner",
    description:
      "How to decide whether an old computer is worth fixing: the cheap upgrades that help most, the problems that aren't worth it, and when to donate or recycle.",
    lede: "A rule of thumb, a few cheap fixes that work wonders, and the signs it's time to let go.",
    card: "A decision guide with the cheap fixes that help most and the signs it's time to move on.",
    body: `
    <h2>Start with what's actually wrong</h2>
    <div class="table-wrap"><table>
      <thead><tr><th scope="col">Symptom</th><th scope="col">Likely cause</th><th scope="col">Usually worth fixing?</th></tr></thead>
      <tbody>
        <tr><th scope="row">Slow to start and slow to open things</th><td>Old spinning hard drive, too little memory</td><td>Yes. An SSD is the single best upgrade for most older machines.</td></tr>
        <tr><th scope="row">Dies when unplugged</th><td>Worn-out battery</td><td>Often, if a replacement for that model is available at a fair price.</td></tr>
        <tr><th scope="row">Hot, loud fan, random shutdowns</th><td>Dust, dried-out thermal paste</td><td>Yes. Cleaning is free; paste is a few dollars.</td></tr>
        <tr><th scope="row">Cracked screen</th><td>Physical damage</td><td>Depends on the model. Check replacement panel prices first.</td></tr>
        <tr><th scope="row">Won't charge</th><td>Bad charger, damaged charging port</td><td>Try another charger first. Port repairs vary a lot.</td></tr>
        <tr><th scope="row">No longer gets security updates</th><td>Software support ended</td><td>Maybe: a lightweight Linux install can extend its life. See <a href="/resources/linux-on-an-old-pc">Linux on an old PC</a>.</td></tr>
        <tr><th scope="row">Water damage, bent board, burnt smell</th><td>Board-level damage</td><td>Rarely. Donate it for parts.</td></tr>
      </tbody>
    </table></div>

    <h2>A simple rule of thumb</h2>
    <p>If the fix costs more than about half the price of a decent used replacement, or the machine can't do what you need even when fixed, move on. If it costs very little and fixes the problem, fix it: the most sustainable computer is the one that already exists.</p>

    <h2>Cheap upgrades that make the most difference</h2>
    <ol>
      <li>Replace a hard disk with an SSD.</li>
      <li>Add memory to at least 8 GB for everyday browsing and office work.</li>
      <li>Clean out dust and, if you're comfortable, renew the thermal paste.</li>
      <li>Reinstall the operating system for a clean start (after backing up).</li>
    </ol>
    <p>The <a href="/resources/upgrade-ram-and-ssd">upgrade guide</a> shows how.</p>

    <h2>When to let it go</h2>
    <p>Once a device is more trouble than it's worth, don't leave it in a drawer: old electronics don't get more valuable and batteries degrade. Run the <a href="/resources/donate-or-recycle">donate, repair, or recycle tool</a>, or offer it to us. Broken is fine. We'll test it, reuse what works, and responsibly recycle the rest.</p>`,
  },
  {
    slug: "upgrade-ram-and-ssd",
    crumb: "Upgrade RAM and SSD",
    title: "How to upgrade RAM and swap in an SSD",
    h1: "Upgrade memory and swap in an SSD",
    level: "Intermediate",
    description:
      "Step-by-step guidance for identifying your laptop or desktop, buying compatible RAM and an SSD, cloning or reinstalling, and avoiding the common mistakes.",
    lede: "The two upgrades that make an old computer feel new again, and how to do them without breaking anything.",
    card: "Find compatible parts, back up, install, and avoid static and compatibility mistakes.",
    body: `
    <h2>Before you buy anything</h2>
    <ol>
      <li><strong>Identify the exact model.</strong> It's printed on the underside label or shown in the system information page. Search the model number plus "service manual" or "upgrade". The maker's manual and <a href="https://www.ifixit.com/">iFixit</a> guides show how to open it.</li>
      <li><strong>Check if parts are replaceable.</strong> Many thin laptops and nearly all recent Macs solder the memory to the board, and some solder or lock the storage.</li>
      <li><strong>Match the memory type.</strong> DDR3, DDR4 and DDR5 are not interchangeable, and laptop (SO-DIMM) and desktop (DIMM) sticks are different sizes. Check how many slots you have and the maximum supported.</li>
      <li><strong>Match the storage connector.</strong> A 2.5-inch SATA SSD fits where a laptop hard disk went. Some machines take M.2 (SATA or NVMe, which differ). The service manual tells you which.</li>
    </ol>

    <h2>The swap</h2>
    <ol>
      <li><strong>Back up.</strong> Then decide whether to clone the old drive or do a fresh install (fresh is usually cleaner on an old machine).</li>
      <li><strong>Power off, unplug, and remove the battery</strong> if it's removable. Hold the power button for ten seconds to drain residual charge.</li>
      <li><strong>Ground yourself.</strong> Touch bare metal on the case before touching components, and hold boards and sticks by their edges.</li>
      <li><strong>Swap the part.</strong> Memory clicks in at an angle and snaps flat. Drives slide into their connector and fasten with a small screw or caddy.</li>
      <li><strong>Reassemble, boot,</strong> and check in the system information that the new memory and drive show up.</li>
      <li><strong>Install the operating system</strong> from a USB drive (see the <a href="/resources/linux-on-an-old-pc">Linux guide</a> for a free option), or restore your clone.</li>
    </ol>

    <h2>Test before you trust it</h2>
    <ul>
      <li>Run <a href="https://www.memtest.org/">MemTest86+</a> for a full pass to catch bad memory.</li>
      <li>Check a drive's health with SMART data (<a href="https://www.smartmontools.org/">smartmontools</a> or the built-in tools). Used drives with reallocated sectors should not hold anything important.</li>
    </ul>

    <h2>Common mistakes</h2>
    <ul>
      <li>Buying the wrong memory generation or form factor.</li>
      <li>Forcing a stick that isn't aligned with its notch.</li>
      <li>Losing tiny screws: sort them into a muffin tin or an egg carton.</li>
      <li>Pulling a swollen battery. If the case is bulging, stop and read the <a href="/resources/batteries-and-e-waste-safety">battery guide</a>.</li>
    </ul>`,
  },
  {
    slug: "linux-on-an-old-pc",
    crumb: "Linux on an old PC",
    title: "Put Linux on an old computer",
    h1: "Give an old PC a second life with Linux",
    level: "Intermediate",
    description:
      "How to try and install a free, up-to-date Linux system on an older computer that Windows no longer supports: choosing a distribution, making a USB installer and installing safely.",
    lede: "A free, supported operating system can keep a computer that Windows has left behind useful for web, email, documents, video calls and more.",
    card: "Pick a distro, make a bootable USB, try it without installing, then install.",
    body: `
    <h2>Why bother</h2>
    <p>Microsoft ended support for Windows 10 on October 14, 2025, and Windows 11 requires newer hardware features (such as TPM 2.0) that many older but perfectly capable machines lack. Mainstream Linux distributions keep receiving security updates on that same hardware and are free.</p>

    <h2>Choose a distribution</h2>
    <div class="table-wrap"><table>
      <thead><tr><th scope="col">Distribution</th><th scope="col">Best for</th></tr></thead>
      <tbody>
        <tr><th scope="row"><a href="https://linuxmint.com/">Linux Mint</a></th><td>First-timers coming from Windows. Familiar layout, works well on modest hardware (the Xfce edition is lightest).</td></tr>
        <tr><th scope="row"><a href="https://ubuntu.com/desktop">Ubuntu</a></th><td>Large community, lots of tutorials, long-term-support releases.</td></tr>
        <tr><th scope="row"><a href="https://fedoraproject.org/workstation/">Fedora Workstation</a></th><td>Newer software, quick updates, good for tinkerers.</td></tr>
      </tbody>
    </table></div>
    <p>As a rough guide, 4 GB of memory is comfortable for everyday use and 2 GB can work with a lightweight desktop. An SSD helps far more than a faster processor does.</p>

    <h2>Try it without installing</h2>
    <ol>
      <li>Download the ISO from the project's own site and verify its checksum if they publish one.</li>
      <li>Write it to a USB stick (4 GB or more, and everything on it will be erased) with a tool such as <a href="https://etcher.balena.io/">balenaEtcher</a>, Rufus on Windows, or Fedora Media Writer.</li>
      <li>Restart and open the one-time boot menu (often F12, F10, Esc or Option, depending on the maker). Choose the USB stick.</li>
      <li>Pick "Try" (or the live session). Check that Wi-Fi, sound, the camera, the trackpad and the screen work.</li>
    </ol>

    <h2>Install</h2>
    <ol>
      <li>Back up your files. A full install replaces whatever is on the disk.</li>
      <li>Choose "erase disk and install" for a clean machine, or install alongside Windows if you have free space and want both. Turn on disk encryption if the laptop travels.</li>
      <li>Finish setup, install updates, and you're done.</li>
    </ol>

    <h2>If something doesn't work</h2>
    <p>Wi-Fi chips, fingerprint readers and some graphics cards are the usual trouble spots. Search the exact model with the distribution name. Many issues have a known fix, and the live session tells you before you commit to anything.</p>`,
  },
  {
    slug: "batteries-and-e-waste-safety",
    crumb: "Batteries and e-waste safety",
    title: "Batteries and e-waste: what to do and what to avoid",
    h1: "Batteries and e-waste safety",
    level: "Beginner",
    description:
      "How to spot a swollen lithium-ion battery, store old devices safely, and where unwanted batteries and electronics should go instead of the trash.",
    lede: "Lithium-ion batteries are the main hazard in old electronics. A few habits keep them safe until they're recycled.",
    card: "Spot swollen batteries, store them safely, and avoid putting electronics in the trash.",
    body: `
    <h2>Signs of a damaged battery</h2>
    <ul>
      <li>The case or trackpad bulges, or the lid no longer sits flat.</li>
      <li>The device is hot when it's off, or has a sweet or chemical smell.</li>
      <li>The battery leaks or has visible dents or punctures.</li>
    </ul>
    <p><strong>If you see any of these, stop using and charging the device.</strong> Don't try to puncture, flatten or squeeze it.</p>

    <h2>What to do with a swollen battery</h2>
    <ol>
      <li>Unplug the device and power it down. Move it away from anything flammable, ideally onto a hard surface such as a tile or concrete floor.</li>
      <li>Don't mail it or put it in a car on a hot day.</li>
      <li>Take it to a battery drop-off that accepts damaged batteries, and tell them it's damaged. Some programs won't take damaged cells; call ahead. The <a href="https://www.call2recycle.org/locator/">Call2Recycle locator</a> is a good start.</li>
    </ol>
    <p>Hardware Club can't accept loose or swollen batteries, so please don't bring them to a handoff.</p>

    <h2>Storing old devices</h2>
    <ul>
      <li>Keep them somewhere cool and dry, away from heat sources and direct sun.</li>
      <li>Tape over the terminals of loose batteries, or bag each one separately.</li>
      <li>Don't leave devices charging unattended for days.</li>
    </ul>

    <h2>Don't put electronics in the trash</h2>
    <p>Electronics contain materials that shouldn't be buried, and batteries have started fires in garbage trucks and recycling facilities. Disposal rules and collection programs vary by community and change over time, so check with your county, city, or the state environment department (EGLE). The <a href="/resources/local-directory">local directory</a> links the official sources, and the <a href="https://www.epa.gov/recycle/electronics-donation-and-recycling">EPA</a> has general guidance.</p>

    <h2>Hardware Club doesn't take</h2>
    <p>CRT monitors and TVs, printers, kitchen and household appliances, and loose or swollen batteries.</p>`,
  },
  {
    slug: "buying-refurbished-hardware",
    crumb: "Buying refurbished",
    title: "How to buy a refurbished laptop or desktop",
    h1: "How to buy refurbished hardware without getting burned",
    level: "Beginner",
    description:
      "What to check before you buy a used or refurbished computer: condition grades, warranty, battery health, specs worth paying for, and red flags.",
    lede: "A good refurbished machine costs far less than new and does the same job. Here is what to look for.",
    card: "Specs worth paying for, checks to run in the first week, and red flags to avoid.",
    body: `
    <h2>What to prioritize</h2>
    <ul>
      <li><strong>An SSD.</strong> More important than almost any other spec.</li>
      <li><strong>8 GB of memory or more</strong> for everyday use, 16 GB if you multitask heavily or keep many browser tabs.</li>
      <li><strong>A processor from the last several years.</strong> Older ones may be fine, but check that the operating system you want supports them.</li>
      <li><strong>A business-class model</strong> (ThinkPad, Latitude, EliteBook and similar) is often sturdier and easier to repair than budget consumer models of the same age.</li>
    </ul>

    <h2>Questions for the seller</h2>
    <ol>
      <li>What is the return window and the warranty, and who honors it?</li>
      <li>What does the condition grade mean in writing?</li>
      <li>Is the battery replaced or tested, and what capacity does it hold?</li>
      <li>Was the drive securely wiped and a fresh operating system installed?</li>
      <li>Are the activation or license details included, and is the machine free of locks (an account lock, firmware password or management profile)?</li>
    </ol>

    <h2>Check it in the first week</h2>
    <ul>
      <li>Inspect the screen for dead pixels and discoloration, and test the keyboard, trackpad, ports, speakers, microphone and camera.</li>
      <li>Check battery wear in the system's battery report and that it charges.</li>
      <li>Check storage health with SMART data and run a memory test (see the <a href="/resources/upgrade-ram-and-ssd">upgrade guide</a>).</li>
      <li>Look in the system information for the specs you paid for.</li>
    </ul>

    <h2>Red flags</h2>
    <ul>
      <li>No returns, vague "as is" language and no photos of the actual item.</li>
      <li>A price far below similar listings.</li>
      <li>The seller can't say whether the machine is locked to someone else's account.</li>
    </ul>
    <p>A printable <a href="/resources/downloads">buying checklist</a> is available.</p>`,
  },
];
