(function () {
  "use strict";

  function el(tag, text, className) {
    var node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function link(href, text) {
    var a = el("a", text);
    a.href = href;
    return a;
  }

  // result = { title, text, steps: [string], links: [[href, label]] }
  function render(box, result) {
    box.textContent = "";
    box.appendChild(el("h2", result.title));
    if (result.text) box.appendChild(el("p", result.text));
    if (result.steps && result.steps.length) {
      var ol = el("ol");
      result.steps.forEach(function (s) {
        ol.appendChild(el("li", s));
      });
      box.appendChild(ol);
    }
    if (result.links && result.links.length) {
      var p = el("p");
      result.links.forEach(function (l, i) {
        if (i) p.appendChild(document.createTextNode(" · "));
        p.appendChild(link(l[0], l[1]));
      });
      box.appendChild(p);
    }
    box.hidden = false;
  }

  var DONATE = ["/#donate", "Offer it to Hardware Club"];
  var DIRECTORY = ["/resources/local-directory", "Local directory"];
  var BATTERY_GUIDE = ["/resources/batteries-and-e-waste-safety", "Battery safety guide"];
  var WIPE_GUIDE = ["/resources/wipe-a-drive-before-donating", "How to wipe a drive"];

  function triage(v) {
    if (v.swollen) {
      return {
        title: "Stop: handle the battery first",
        text: "A swollen, leaking or very hot battery is a fire risk. Don't charge or use the device, and don't bring it to a handoff. We can't accept swollen batteries.",
        steps: [
          "Unplug it, power it down, and set it on a hard, non-flammable surface away from anything flammable.",
          "Take it to a battery drop-off that accepts damaged batteries (call ahead).",
        ],
        links: [BATTERY_GUIDE, DIRECTORY],
      };
    }
    if (v.device === "other") {
      return {
        title: "Recycle it through an official program",
        text: "Hardware Club doesn't take CRT monitors and TVs, printers, or kitchen and household appliances.",
        steps: ["Use a recycling locator or your county or city e-waste program.", "Don't put it in the regular trash."],
        links: [DIRECTORY],
      };
    }
    if (v.device === "parts") {
      return {
        title: "Donate it",
        text: "Working parts, memory, drives, chargers and cables are useful to us. Wipe or remove any drive you want to keep private.",
        steps: ["Group items by type and note anything you know is faulty.", "Tell us what you have in the donation form."],
        links: [DONATE, WIPE_GUIDE],
      };
    }
    if (v.power === "works" && v.age === "new") {
      return {
        title: "Consider keeping it, or donate it",
        text: "A working device under 5 years old has plenty of life left. If you've replaced it or don't use it, it's an ideal donation.",
        steps: ["Wipe it and sign out of your accounts.", "Include the charger."],
        links: [DONATE, WIPE_GUIDE],
      };
    }
    if (v.power === "works") {
      return {
        title: "Donate it, or give it a cheap upgrade first",
        text: "It works, so it can serve someone else. On a computer, an SSD or more memory can add years of life if you want to keep it.",
        steps: ["Wipe it and sign out of your accounts.", "Include the charger and note the specs."],
        links: [DONATE, ["/resources/upgrade-ram-and-ssd", "Upgrade guide"], WIPE_GUIDE],
      };
    }
    if (v.power === "issues") {
      return {
        title: v.age === "old" ? "Donate it for parts or repair" : "Repair it if the fix is cheap, otherwise donate",
        text: "Many faults are inexpensive: a battery, a charger, dust, or a slow hard disk. If the fix costs more than about half of a decent used replacement, donating is the better choice. We welcome broken laptops, desktops and servers.",
        steps: ["Note what's wrong.", "Wipe or remove the drive if it still works."],
        links: [["/resources/repair-or-replace-old-computer", "Repair or replace guide"], DONATE],
      };
    }
    return {
      title: "Donate it for parts, or recycle it",
      text: "A device that won't power on can still have good memory, drives, screens and chargers. We take broken laptops, desktops and servers and reuse what works. We recycle the rest.",
      steps: ["If a drive might still be readable, remove it and keep it, or tell us you want it back."],
      links: [DONATE, WIPE_GUIDE],
    };
  }

  var WIPES = {
    windows: function (drive) {
      var steps = [
        "Back up your files, then sign out of your Microsoft account.",
        "Open Settings > System > Recovery > Reset this PC > Remove everything. Choose the option to clean the drive if it's offered.",
      ];
      if (drive === "ssd" || drive === "unknown") {
        steps.splice(1, 0, "Turn on device encryption or BitLocker first. The reset then discards the key, which is the reliable way to erase an SSD.");
      }
      return { title: "Windows steps", steps: steps };
    },
    mac: function () {
      return {
        title: "Mac steps",
        steps: [
          "Back up, then sign out of iCloud and turn off Find My.",
          "On Apple silicon or T2 Macs running macOS Monterey or later: System Settings > General > Transfer or Reset > Erase All Content and Settings.",
          "On older Intel Macs: restart into Recovery, erase the disk in Disk Utility, then reinstall macOS.",
        ],
      };
    },
    iphone: function () {
      return {
        title: "iPhone / iPad steps",
        steps: [
          "Back up, then turn off Find My and sign out of your Apple ID.",
          "Settings > General > Transfer or Reset > Erase All Content and Settings.",
        ],
      };
    },
    android: function () {
      return {
        title: "Android steps",
        steps: [
          "Back up, then remove your Google account (this avoids Factory Reset Protection locking out the next owner).",
          "Remove the SIM and any memory card.",
          "Settings > System > Reset options > Erase all data (factory reset). Menu names vary by maker.",
        ],
      };
    },
    chromebook: function () {
      return {
        title: "Chromebook steps",
        steps: [
          "Back up anything you need, and remove the device from any school or work management.",
          "Sign out, then Settings > Reset settings > Powerwash.",
        ],
      };
    },
    linux: function (drive) {
      var steps = ["Back up your files."];
      if (drive === "hdd") {
        steps.push("Boot a live USB with nwipe and run a one-pass zero overwrite on the whole disk.");
      } else if (drive === "ssd") {
        steps.push("Use your SSD maker's secure-erase tool, or the drive's sanitize / secure-erase command. Avoid multi-pass overwrites on SSDs.");
      } else {
        steps.push("Find out whether the drive is an HDD or SSD (search the model number). Then use nwipe for HDDs, or a secure-erase / sanitize command for SSDs.");
      }
      steps.push("Check the drive shows as empty before you hand it over.");
      return { title: "Linux PC steps", steps: steps };
    },
  };

  function wipe(v) {
    var result;
    if (v.wbroken) {
      result = {
        title: "Remove and keep the drive, or destroy it",
        text: "If the device won't power on, software can't erase it. Take the drive out and keep it, or destroy it physically. Tell us on the donation form and we can take the rest without the drive.",
        steps: ["Look up the drive location for your model (search the model plus 'service manual').", "Keep the drive, or destroy it so the platters or chips are broken."],
      };
    } else {
      result = WIPES[v.wdevice](v.wdrive);
    }
    result.links = [WIPE_GUIDE, ["/resources/downloads", "Printable cheat sheet"], DONATE];
    return result;
  }

  function bind(formId, boxId, compute) {
    var form = document.getElementById(formId);
    var box = document.getElementById(boxId);
    if (!form || !box) return;
    function update() {
      var values = {};
      Array.prototype.forEach.call(form.elements, function (field) {
        if (!field.name) return;
        values[field.name] = field.type === "checkbox" ? field.checked : field.value;
      });
      render(box, compute(values));
    }
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      update();
    });
    update();
  }

  bind("triage-form", "triage-result", triage);
  bind("wipe-form", "wipe-result", wipe);
})();
