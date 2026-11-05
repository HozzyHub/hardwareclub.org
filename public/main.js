(function () {
  "use strict";

  var form = document.getElementById("donate-form");
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var statusBox = document.getElementById("form-status");
  var submitLabel = submitBtn.textContent;

  // Show that the request is in flight: the button would otherwise just go
  // grey for the second or two the POST and Turnstile check take.
  function setSending(sending) {
    submitBtn.disabled = sending;
    submitBtn.textContent = sending ? "Sending\u2026" : submitLabel;
    if (sending) {
      form.setAttribute("aria-busy", "true");
    } else {
      form.removeAttribute("aria-busy");
    }
  }

  var errorAnchors = {
    categories: '[name="categories[]"]',
    turnstile: ".cf-turnstile",
  };

  function clearErrors() {
    var errors = form.querySelectorAll(".field-error");
    for (var i = 0; i < errors.length; i++) {
      errors[i].remove();
    }
    var invalidFields = form.querySelectorAll('[aria-invalid="true"]');
    for (var j = 0; j < invalidFields.length; j++) {
      invalidFields[j].removeAttribute("aria-invalid");
      invalidFields[j].removeAttribute("aria-describedby");
    }
    statusBox.hidden = true;
    statusBox.textContent = "";
  }

  function showStatus(message) {
    statusBox.hidden = false;
    statusBox.dataset.state = "error";
    statusBox.textContent = message;
  }

  function showFieldError(name, message) {
    var anchor = form.querySelector(errorAnchors[name] || '[name="' + name + '"]');
    if (!anchor) {
      showStatus(message);
      return;
    }

    var p = document.createElement("p");
    p.className = "field-error";
    p.tabIndex = -1;
    p.id = "error-" + name.replace(/[^a-z0-9_-]/gi, "");
    p.textContent = message;

    if (anchor.matches("input, select, textarea")) {
      var controls = form.querySelectorAll('[name="' + anchor.name + '"]');
      for (var i = 0; i < controls.length; i++) {
        controls[i].setAttribute("aria-invalid", "true");
        controls[i].setAttribute("aria-describedby", p.id);
      }
      var container = anchor.closest("fieldset, .field");
      if (container) {
        container.appendChild(p);
        return;
      }
      anchor = anchor.closest("label") || anchor;
    }
    anchor.insertAdjacentElement("afterend", p);
  }

  function focusFirstError() {
    var target =
      form.querySelector('[aria-invalid="true"]') ||
      form.querySelector(".field-error") ||
      (statusBox.hidden ? null : statusBox);
    if (target) target.focus();
  }

  function resetTurnstile() {
    if (window.turnstile) {
      var widget = form.querySelector(".cf-turnstile");
      if (widget) window.turnstile.reset(widget);
    }
  }

  // After a successful send the page navigates to /thanks with the button
  // still disabled; re-enable it if Back restores the page from bfcache.
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) setSending(false);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (submitBtn.disabled) return;
    clearErrors();
    setSending(true);

    var formData = new FormData(form);

    fetch("/api/submit", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { response: response, data: data };
          });
      })
      .then(function (result) {
        if (result.response.ok && result.data.ok) {
          window.location.href = "/thanks";
          return;
        }

        setSending(false);
        resetTurnstile();

        if (result.data && result.data.errors) {
          var fields = Object.keys(result.data.errors);
          for (var i = 0; i < fields.length; i++) {
            showFieldError(fields[i], result.data.errors[fields[i]]);
          }
        } else {
          showStatus("Something went wrong sending that. Please try again.");
        }
        focusFirstError();
      })
      .catch(function () {
        setSending(false);
        resetTurnstile();
        showStatus("Something went wrong sending that. Please try again.");
        focusFirstError();
      });
  });
})();
