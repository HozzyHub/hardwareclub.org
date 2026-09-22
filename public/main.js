(function () {
  "use strict";

  var form = document.getElementById("donate-form");
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var statusBox = document.getElementById("form-status");

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

  function showFieldError(name, message) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) {
      statusBox.hidden = false;
      statusBox.dataset.state = "error";
      statusBox.textContent = message;
      return;
    }
    field.setAttribute("aria-invalid", "true");
    var container = field.closest(".field") || field.parentElement;
    var p = document.createElement("p");
    p.className = "field-error";
    p.textContent = message;
    container.appendChild(p);
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
          var firstField = form.querySelector('[aria-invalid="true"]');
          if (firstField) firstField.focus();
        } else {
          statusBox.hidden = false;
          statusBox.dataset.state = "error";
          statusBox.textContent =
            "Something went wrong sending that. Please try again.";
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        resetTurnstile();
        statusBox.hidden = false;
        statusBox.dataset.state = "error";
        statusBox.textContent =
          "Something went wrong sending that. Please try again.";
      });
  });
})();
