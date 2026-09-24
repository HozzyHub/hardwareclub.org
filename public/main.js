(function () {
  "use strict";

  var form = document.getElementById("donate-form");
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var statusBox = document.getElementById("form-status");

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
    p.textContent = message;

    if (anchor.matches("input, select, textarea")) {
      var controls = form.querySelectorAll('[name="' + anchor.name + '"]');
      for (var i = 0; i < controls.length; i++) {
        controls[i].setAttribute("aria-invalid", "true");
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();
    submitBtn.disabled = true;

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

        submitBtn.disabled = false;
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
        submitBtn.disabled = false;
        resetTurnstile();
        showStatus("Something went wrong sending that. Please try again.");
        focusFirstError();
      });
  });
})();
