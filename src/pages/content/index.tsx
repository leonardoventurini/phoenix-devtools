import { createRoot } from "react-dom/client";
import "./style.css";
import {
  Message,
  MessageType,
  MessageDirection,
} from "../../components/devtools/types";

const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
root.render(
  <div className="fixed bottom-0 left-0 text-lg text-black bg-amber-400 z-50">
    Phoenix DevTools
  </div>
);

// Highlight management
class ElementHighlighter {
  private activeHighlights = new Set<Element>();

  highlightElement(
    element: Element,
    direction: MessageDirection,
    eventType?: string
  ) {
    if (!element || this.activeHighlights.has(element)) return;

    this.activeHighlights.add(element);

    const directionClass =
      direction === MessageDirection.Inbound
        ? "phx-devtools-highlight-inbound"
        : "phx-devtools-highlight-outbound";

    element.classList.add("phx-devtools-highlight", directionClass);

    if (eventType) {
      const label = document.createElement("div");
      label.className = `phx-devtools-label phx-devtools-label-${
        direction === MessageDirection.Inbound ? "inbound" : "outbound"
      }`;
      label.textContent = `PHX: ${eventType}`;
      label.style.position = "absolute";
      label.style.zIndex = "10001";

      const rect = element.getBoundingClientRect();
      label.style.top = `${rect.top + window.scrollY - 25}px`;
      label.style.left = `${rect.left + window.scrollX}px`;

      document.body.appendChild(label);

      setTimeout(() => {
        if (label.parentNode) {
          label.parentNode.removeChild(label);
        }
      }, 2000);
    }

    setTimeout(() => {
      this.removeHighlight(element);
    }, 2000);
  }

  private removeHighlight(element: Element) {
    element.classList.remove(
      "phx-devtools-highlight",
      "phx-devtools-highlight-inbound",
      "phx-devtools-highlight-outbound"
    );
    this.activeHighlights.delete(element);
  }

  highlightElementsFromMessage(data: any, direction: MessageDirection) {
    try {
      let parsedData: any;

      if (typeof data === "string") {
        parsedData = JSON.parse(data);
      } else {
        parsedData = data;
      }

      if (Array.isArray(parsedData) && parsedData.length >= 4) {
        const [, , topic, event, payload] = parsedData;

        if (topic && topic.startsWith("lv:")) {
          this.highlightPhoenixLiveViewElements(payload, direction, event);
        }
      } else if (parsedData.topic && parsedData.payload) {
        if (parsedData.topic.startsWith("lv:")) {
          this.highlightPhoenixLiveViewElements(
            parsedData.payload,
            direction,
            parsedData.event
          );
        }
      }
    } catch (e) {
      console.debug("Could not parse message for highlighting:", e);
    }
  }

  private highlightPhoenixLiveViewElements(
    payload: any,
    direction: MessageDirection,
    eventType?: string
  ) {
    if (!payload) return;

    const elementsToHighlight: Element[] = [];

    if (payload.d) {
      const diffs = Array.isArray(payload.d) ? payload.d : [payload.d];

      diffs.forEach((diff: any) => {
        if (Array.isArray(diff)) {
          diff.forEach((item: any) => {
            if (typeof item === "object" && item !== null) {
              this.extractElementsFromDiff(item, elementsToHighlight);
            }
          });
        } else if (typeof diff === "object") {
          this.extractElementsFromDiff(diff, elementsToHighlight);
        }
      });
    }

    if (payload.r && typeof payload.r === "object") {
      this.extractElementsFromReplies(payload.r, elementsToHighlight);
    }

    if (payload.c && typeof payload.c === "object") {
      Object.values(payload.c).forEach((component: any) => {
        if (component && typeof component === "object") {
          this.extractElementsFromDiff(component, elementsToHighlight);
        }
      });
    }

    if (payload.s && Array.isArray(payload.s)) {
      payload.s.forEach((selector: string) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => elementsToHighlight.push(el));
        } catch (e) {
          console.debug("Invalid selector:", selector);
        }
      });
    }

    if (elementsToHighlight.length === 0) {
      this.highlightLiveViewContainer(direction, eventType);
    } else {
      elementsToHighlight.forEach((element) => {
        this.highlightElement(element, direction, eventType);
      });
    }
  }

  private extractElementsFromDiff(diff: any, elementsToHighlight: Element[]) {
    Object.keys(diff).forEach((key) => {
      if (key.startsWith("d-")) {
        const cid = key.substring(2);
        const elements = document.querySelectorAll(`[phx-component="${cid}"]`);
        elements.forEach((el) => elementsToHighlight.push(el));
      } else if (key.match(/^\d+$/)) {
        const elements = document.querySelectorAll(
          `[data-phx-component="${key}"]`
        );
        elements.forEach((el) => elementsToHighlight.push(el));
      }
    });
  }

  private extractElementsFromReplies(
    replies: any,
    elementsToHighlight: Element[]
  ) {
    Object.keys(replies).forEach((key) => {
      if (key.match(/^\d+$/)) {
        const elements = document.querySelectorAll(`[data-phx-ref="${key}"]`);
        elements.forEach((el) => elementsToHighlight.push(el));
      }
    });
  }

  private highlightLiveViewContainer(
    direction: MessageDirection,
    eventType?: string
  ) {
    const liveViewContainers = document.querySelectorAll("[data-phx-main]");
    if (liveViewContainers.length > 0) {
      liveViewContainers.forEach((container) => {
        this.highlightElement(container, direction, eventType);
      });
    } else {
      const phxContainers = document.querySelectorAll("[phx-socket-id]");
      if (phxContainers.length > 0) {
        phxContainers.forEach((container) => {
          this.highlightElement(container, direction, eventType);
        });
      }
    }
  }
}

const highlighter = new ElementHighlighter();
let highlightingEnabled = true;

// Listen for messages from the DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggle-highlighting") {
    highlightingEnabled = message.enabled;
    console.log(
      "Element highlighting",
      highlightingEnabled ? "enabled" : "disabled"
    );
  }
});

// Function to safely stringify data
function safeStringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (e) {
    return String(data);
  }
}

// Function to intercept Phoenix LiveView messages
function interceptPhoenixMessages() {
  // Instead of injecting an inline script, we'll use a more CSP-friendly approach
  // by communicating with the page through a custom event system

  // Set up listeners for our custom events from the page
  setupPageToContentScriptEvents();

  // Create a script element that points to our injected script
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected-script.js");
  script.onload = function () {
    // Clean up once loaded
    script.remove();
    // Signal to start the interception with the current tab ID
    chrome.runtime.sendMessage(
      { action: "get-current-tab-id" },
      function (response) {
        if (response && response.tabId) {
          window.dispatchEvent(
            new CustomEvent("phx-devtools:start-interception", {
              detail: { tabId: response.tabId },
            })
          );
        } else {
          // Fallback if we can't get the tab ID
          window.dispatchEvent(
            new CustomEvent("phx-devtools:start-interception")
          );
        }
      }
    );
  };

  // Add the script to the page
  (document.head || document.documentElement).appendChild(script);

  // Try to find liveSocket repeatedly until found
  window.addEventListener("phoenix:devtools:ready", () => {
    console.log("Phoenix LiveSocket intercepted successfully");
  });

  // Listen for not found event
  window.addEventListener("phoenix:devtools:not-found", () => {
    // Try again after a delay
    console.log("Phoenix LiveSocket not found, will continue checking");
    setTimeout(() => {
      chrome.runtime.sendMessage(
        { action: "get-current-tab-id" },
        function (response) {
          if (response && response.tabId) {
            window.dispatchEvent(
              new CustomEvent("phx-devtools:start-interception", {
                detail: { tabId: response.tabId },
              })
            );
          } else {
            window.dispatchEvent(
              new CustomEvent("phx-devtools:start-interception")
            );
          }
        }
      );
    }, 1000);
  });
}

// Set up event listeners for custom events from the page
function setupPageToContentScriptEvents() {
  // Listen for Phoenix connection info
  window.addEventListener("phoenix:connection:info", ((event: Event) => {
    const customEvent = event as CustomEvent;
    console.log("Phoenix connection info", customEvent);
    const connectionInfo = customEvent.detail?.connectionInfo;
    const tabId = customEvent.detail?.tabId;

    // Send to background script
    chrome.runtime.sendMessage({
      action: "phoenix-connection-info",
      connectionInfo,
      tabId,
    });
  }) as EventListener);

  // Listen for channel updates
  window.addEventListener("phoenix:channels:updated", ((event: Event) => {
    const customEvent = event as CustomEvent;
    const channels = customEvent.detail.channels;
    const tabId = customEvent.detail.tabId;

    // Send to background script
    chrome.runtime.sendMessage({
      action: "phoenix-channels-updated",
      channels,
      tabId,
    });
  }) as EventListener);

  // Listen for inbound messages
  window.addEventListener("phoenix:message:inbound", ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { data, parsedData, affectedElements, tabId } = customEvent.detail;

    // Highlight elements affected by this message (only if highlighting is enabled)
    if (highlightingEnabled) {
      try {
        if (affectedElements && affectedElements.length > 0) {
          // Use specific elements if available
          affectedElements.forEach((elementInfo: any) => {
            try {
              const elements = document.querySelectorAll(elementInfo.selector);
              elements.forEach((element) => {
                highlighter.highlightElement(
                  element,
                  MessageDirection.Inbound,
                  elementInfo.type
                );
              });
            } catch (e) {
              console.debug(
                "Could not query selector for highlighting:",
                elementInfo.selector
              );
            }
          });
        } else {
          // Fallback to general message parsing
          const dataToHighlight = parsedData || data;
          highlighter.highlightElementsFromMessage(
            dataToHighlight,
            MessageDirection.Inbound
          );
        }
      } catch (e) {
        console.debug("Could not highlight elements for inbound message:", e);
      }
    }

    const message: Partial<Message> = {
      method: "Phoenix.receive",
      data: safeStringify(data),
      parsedData: safeStringify(parsedData),
      type: MessageType.WebSocket,
      direction: MessageDirection.Inbound,
      size: new TextEncoder().encode(data).length,
      isPhoenix: true,
      timestamp: Date.now(),
      tabId,
    };

    // Send to background script
    chrome.runtime.sendMessage({ action: "phoenix-message", message });
  }) as EventListener);

  // Listen for outbound messages
  window.addEventListener("phoenix:message:outbound", ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { data, parsedData, tabId } = customEvent.detail;

    // Highlight elements affected by this message (only if highlighting is enabled)
    if (highlightingEnabled) {
      try {
        const dataToHighlight = parsedData || data;
        highlighter.highlightElementsFromMessage(
          dataToHighlight,
          MessageDirection.Outbound
        );
      } catch (e) {
        console.debug("Could not highlight elements for outbound message:", e);
      }
    }

    const message: Partial<Message> = {
      method: "Phoenix.send",
      data: safeStringify(data),
      parsedData: safeStringify(parsedData),
      type: MessageType.WebSocket,
      direction: MessageDirection.Outbound,
      size: new TextEncoder().encode(data).length,
      isPhoenix: true,
      timestamp: Date.now(),
      tabId,
    };

    // Send to background script
    chrome.runtime.sendMessage({ action: "phoenix-message", message });
  }) as EventListener);

  // Listen for HTTP outbound requests
  window.addEventListener("phoenix:http:outbound", ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { requestInfo, tabId } = customEvent.detail;

    // Check if requestInfo is valid
    if (!requestInfo || typeof requestInfo !== "object") {
      console.error("Invalid request info received", requestInfo);
      return;
    }

    const message: Partial<Message> = {
      method: `HTTP.${requestInfo.method || "REQUEST"}`,
      data: safeStringify(requestInfo),
      parsedData: safeStringify(requestInfo),
      type: MessageType.Http,
      direction: MessageDirection.Outbound,
      size: new TextEncoder().encode(JSON.stringify(requestInfo)).length,
      isPhoenix: true, // Mark all as Phoenix for now, filtering can happen in devtools
      timestamp: Date.now(),
      tabId,
    };

    // Send to background script
    chrome.runtime.sendMessage({ action: "phoenix-message", message });
  }) as EventListener);

  // Listen for HTTP inbound responses
  window.addEventListener("phoenix:http:inbound", ((event: Event) => {
    const customEvent = event as CustomEvent;
    const { responseInfo, tabId } = customEvent.detail;

    // Check if responseInfo is valid
    if (!responseInfo || typeof responseInfo !== "object") {
      console.error("Invalid response info received", responseInfo);
      return;
    }

    const message: Partial<Message> = {
      method: `HTTP.Response.${responseInfo.status || "UNKNOWN"}`,
      data: safeStringify(responseInfo),
      parsedData: safeStringify(responseInfo),
      type: MessageType.Http,
      direction: MessageDirection.Inbound,
      size: new TextEncoder().encode(JSON.stringify(responseInfo)).length,
      isPhoenix: true, // Mark all as Phoenix for now, filtering can happen in devtools
      timestamp: Date.now(),
      tabId,
    };

    // Send to background script
    chrome.runtime.sendMessage({ action: "phoenix-message", message });
  }) as EventListener);

  // Listen for HTTP errors
  window.addEventListener("phoenix:http:error", ((event: Event) => {
    const customEvent = event as CustomEvent;
    const errorInfo = customEvent.detail;
    const tabId = customEvent.detail.tabId;

    // Check if errorInfo is valid
    if (!errorInfo || typeof errorInfo !== "object") {
      console.error("Invalid error info received", errorInfo);
      return;
    }

    const message: Partial<Message> = {
      method: "HTTP.Error",
      data: safeStringify(errorInfo),
      parsedData: safeStringify(errorInfo),
      type: MessageType.Http,
      direction: MessageDirection.Inbound,
      size: new TextEncoder().encode(JSON.stringify(errorInfo)).length,
      isPhoenix: true, // Mark all as Phoenix for now, filtering can happen in devtools
      timestamp: Date.now(),
      tabId,
    };

    // Send to background script
    chrome.runtime.sendMessage({ action: "phoenix-message", message });
  }) as EventListener);
}

try {
  console.log("Phoenix DevTools content script loaded");
  interceptPhoenixMessages();
} catch (e) {
  console.error("Error initializing Phoenix DevTools:", e);
}
