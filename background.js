chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          transform: {
            queryTransform: {
              // add or replace the `utm` parameter
              addOrReplaceParams: [
                { key: "utm", value: "14" }
              ]
            }
          }
        }
      },
      condition: {
        // Match any Google Search URL
        urlFilter: "|https://www.google.com/search",
        resourceTypes: ["main_frame"]
      }
    }
  ],
  removeRuleIds: [1]  // ensure idempotency if reloaded
});
