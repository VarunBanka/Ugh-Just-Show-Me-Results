// background.js

// Define the rule ID
const RULE_ID = 1;

// Define the rule to add the utm parameter
const RULE = {
  id: RULE_ID,
  priority: 1,
  action: {
    type: "redirect",
    redirect: {
      // Use transform to modify the query parameters
      transform: {
        queryTransform: {
          // Add or replace the 'udm' parameter with value '14'
          addOrReplaceParams: [{ key: "udm", value: "14" }]
        }
      }
    }
  },
  condition: {
    // Apply the rule only to Google search result pages
    // Note: Using urlFilter might be too broad. Consider requestDomains or more specific filters if needed.
    urlFilter: "||google.com/search*", // More robust filter
    // Apply only to the main page request
    resourceTypes: ["main_frame"]
  }
};

/**
 * Updates the declarativeNetRequest rules based on the enabled state.
 * First removes the rule, then adds it back if enabled.
 * @param {boolean} enabled - Whether the rule should be active.
 */
async function updateRule(enabled) {
  console.log(`Attempting to update rule ${RULE_ID}. Enabled: ${enabled}`);

  // Step 1: Always attempt to remove the existing rule first to avoid ID conflicts.
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID] // Only remove in this step
    });
    console.log(`Rule ${RULE_ID} potentially removed (if it existed).`);
  } catch (error) {
    // Log errors during removal, but don't stop the process.
    // This might happen if the rule didn't exist initially.
    console.warn(`Error removing rule ${RULE_ID} (it might not have existed):`, error);
  }

  // Step 2: If enabled is true, add the rule back.
  if (enabled) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [RULE] // Only add in this step
      });
      console.log(`Rule ${RULE_ID} added successfully.`);
    } catch (error) {
      // Log any errors that occur during the addition phase.
      console.error(`Error adding rule ${RULE_ID}:`, error);
    }
  } else {
    // If not enabled, the rule remains removed from Step 1.
    console.log(`Rule ${RULE_ID} ensured removed (not adding back).`);
  }

  // Optional: Verify the current rules
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  console.log("Current dynamic rules:", currentRules);
}

// On extension installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed or updated:", details.reason);
  // Initialize state from storage, defaulting to enabled (true)
  const result = await chrome.storage.local.get('enabled');
  // Use nullish coalescing (??) for a cleaner default value check
  const enabled = result.enabled ?? true; // <--- THIS LINE
  console.log("Initial enabled state from storage:", enabled);
  // Apply the rule based on the stored or default state
  await updateRule(enabled);
});

// Listen for messages from the popup (or other extension parts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message action is to set the enabled state
  if (message.action === 'setEnabled') {
    const newEnabledState = message.enabled;
    console.log(`Received message to set enabled state to: ${newEnabledState}`);
    // Store the new state in local storage
    chrome.storage.local.set({ enabled: newEnabledState }, () => {
      // Check for potential errors during storage set
      if (chrome.runtime.lastError) {
        console.error("Error setting storage:", chrome.runtime.lastError);
        // Optionally send an error response back
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return; // Exit early
      }
      console.log(`Stored enabled state: ${newEnabledState}`);
      // Update the rule based on the new state
      updateRule(newEnabledState).then(() => {
         // Send a success response back to the sender
         sendResponse({ success: true });
      }).catch(error => {
         console.error("Error updating rule after message:", error);
         sendResponse({ success: false, error: error.message });
      });
    });
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
  // Handle other potential message types if needed
  return false; // Indicate synchronous response or no response needed
});
