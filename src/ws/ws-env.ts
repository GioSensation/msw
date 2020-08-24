import { WebSocketOvereride } from './WebSocketOverride'

export function setupWebSocketEnvironment() {
  WebSocket = WebSocketOvereride

  // @ts-ignore
  // Mark WebSocket class as patched to prevent multiple patches.
  WebSocket.__mswPatch = true
}
