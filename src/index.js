"use strict";
window.onload = function () {
  function getSettings() {
    const el = document.querySelector("#imaticIssueType");
    if (el == null) {
      return;
    }

    return JSON.parse(el.dataset.data);
  }

  let settings = getSettings();
}