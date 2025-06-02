import { Message, PhoenixConnection } from '../../components/devtools/types'

const MAX_MESSAGES = 10000

// Store connected devtools ports
const devToolsPorts: chrome.runtime.Port[] = []

// Track last timestamp to ensure uniqueness
let lastTimestamp = 0

// Function to get unique timestamp (避ける - sakeru, meaning to avoid duplicates)
function getUniqueTimestamp(): number {
  const now = Date.now()
  if (now <= lastTimestamp) {
    lastTimestamp = lastTimestamp + 1
    return lastTimestamp
  }
  lastTimestamp = now
  return now
}

// Function to hash messages to create unique identifiers
async function hashMessage(message: string): Promise<string> {
  const encoder = new globalThis.TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Function to broadcast messages to all connected devtools panels
function broadcastToDevTools(data: {
  messages?: Message[] | null
  connections?: PhoenixConnection[] | null
}) {
  devToolsPorts.forEach((port) => {
    port.postMessage(data)
  })
}

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'devtools') {
    // Add to connected ports
    devToolsPorts.push(port)

    // Send current messages
    chrome.storage.local.get(
      ['messages', 'websocketConnections'],
      function (result) {
        if (result.messages) {
          port.postMessage({ messages: result.messages })
        }

        if (result.websocketConnections) {
          port.postMessage({ connections: result.websocketConnections })
        }
      }
    )

    port.onDisconnect.addListener(function () {
      // Remove from connected ports
      const index = devToolsPorts.indexOf(port)
      if (index !== -1) {
        devToolsPorts.splice(index, 1)
      }
    })

    port.onMessage.addListener(function (request) {
      if (request.action === 'getMessages') {
        // Retrieve and send all stored messages and connections
        chrome.storage.local.get(
          ['messages', 'websocketConnections'],
          function (result) {
            if (result.messages) {
              port.postMessage({ messages: result.messages })
            }

            if (result.websocketConnections) {
              port.postMessage({ connections: result.websocketConnections })
            }
          }
        )
      } else if (request.action === 'clearMessages') {
        // Clear all stored messages
        chrome.storage.local.set({
          messages: [],
          websocketConnections: [],
        })

        // Broadcast empty message list to all devtools panels
        broadcastToDevTools({
          messages: [],
          connections: [],
        })
      }
    })
  }
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'phoenix-message' && request.message) {
    // Hash the message
    hashMessage(JSON.stringify(request.message)).then((messageHash) => {
      // Add the hash to the message and ensure tabId is set with unique timestamp
      const message = {
        ...request.message,
        hash: messageHash,
        timestamp: getUniqueTimestamp(),
        // Use tabId from message if available, otherwise from sender
        tabId: request.message.tabId || sender.tab?.id,
      }

      // Store in local storage
      chrome.storage.local.get(['messages'], function (result) {
        let messages = result.messages || []
        messages.push(message)

        if (messages.length > MAX_MESSAGES) {
          messages = messages.slice(-MAX_MESSAGES)
        }

        chrome.storage.local.set({ messages })

        // Broadcast to all connected devtools panels
        broadcastToDevTools({
          messages,
          connections: null,
        })
      })
    })
  } else if (request.action === 'get-current-tab-id') {
    // Return the current tab ID to the content script
    sendResponse({ tabId: sender.tab?.id })
    return true // Keep the message channel open for the async response
  } else if (
    request.action === 'phoenix-connection-info' &&
    request.connectionInfo
  ) {
    // Store Phoenix connection info
    const connectionInfo = {
      ...request.connectionInfo,
      // Use explicit tabId from the request if available, otherwise use sender.tab.id
      tabId: request.tabId || sender.tab?.id,
      timestamp: Date.now(),
      isPhoenix: true,
    }

    // Hash and store connection
    hashMessage(JSON.stringify(connectionInfo)).then((connectionHash) => {
      chrome.storage.local.get(['websocketConnections'], function (result) {
        let connections: PhoenixConnection[] = result.websocketConnections || []

        // Replace if same tab connection exists, add otherwise
        const tabIndex = connections.findIndex(
          (conn: PhoenixConnection) => conn.tabId === connectionInfo.tabId
        )
        if (tabIndex !== -1) {
          connections[tabIndex] = { ...connectionInfo, hash: connectionHash }
        } else {
          connections.push({ ...connectionInfo, hash: connectionHash })
        }

        chrome.storage.local.set({ websocketConnections: connections })

        // Broadcast connection info to devtools
        broadcastToDevTools({
          connections,
          messages: null,
        })
      })
    })
  } else if (
    request.action === 'phoenix-channels-updated' &&
    request.channels
  ) {
    // Update channels for the current connection
    chrome.storage.local.get(['websocketConnections'], function (result) {
      let connections: PhoenixConnection[] = result.websocketConnections || []

      // Find the connection for this tab - use tabId from request if available
      const tabId = request.tabId || sender.tab?.id
      const tabIndex = connections.findIndex(
        (conn: PhoenixConnection) => conn.tabId === tabId
      )
      if (tabIndex !== -1) {
        // Update the channels
        connections[tabIndex].channels = request.channels
        chrome.storage.local.set({ websocketConnections: connections })

        // Broadcast updated connections
        broadcastToDevTools({
          connections,
          messages: null,
        })
      }
    })
  }
})
