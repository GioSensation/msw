import { webSocketStorage } from './webSocketStorage'
import { setupWebSocketEnvironment } from './ws-env'

// Create a broadcast channel that synchronizes events originated from a single tab
// across multiple tabs of the same origin.
export const channel = new BroadcastChannel('ws-channel')

// @ts-ignore
if (!WebSocket.__mswPatch) {
  setupWebSocketEnvironment()
}

export const ws = {
  /**
   * Creates a WebSocket interception instance on the given URL.
   */
  link(url: string) {
    // Store all the links to know when a WebSocket instance
    // has a corresponding mocking link. If not, the instance must
    // operate as a regular WebSocket instance.
    webSocketStorage.addLink(url)

    channel.addEventListener('message', (event) => {
      webSocketStorage.dispatchGlobalEvent(url, 'message', event.data)
    })

    return {
      send<Data>(data: Data) {
        channel.postMessage(data)
        webSocketStorage.dispatchGlobalEvent(url, 'message', data)
      },
    }
  },
}
