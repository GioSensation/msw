class MessageEventOverride<Data> extends Event {
  data: Data | undefined

  constructor(type: string, data?: Data) {
    super(type)
    this.data = data
  }
}

class WebSocketStorage {
  links: string[] = []
  sockets: Array<[string, WebSocket]> = []

  addLink(url: string) {
    this.links.push(url)
  }

  addSocket(socket: WebSocket, url: string) {
    this.sockets.push([url, socket])
  }

  removeSocket(socket: WebSocket, url: string) {
    const nextSockets = this.sockets.filter(([socketUrl, socketRef]) => {
      if (socketUrl === url) {
        return socketRef !== socket
      }

      return true
    })
    this.sockets = nextSockets
  }

  lookupLink(url: string) {
    return this.links.find((linkUrl) => linkUrl === url)
  }

  lookupSockets(url: string): WebSocket[] {
    return this.sockets
      .filter(([socketUrl]) => socketUrl === url)
      .map(([, socket]) => socket)
  }

  // Dispatches a given WebSocket event across all WebSockets
  // of the current client.
  dispatchGlobalEvent<Data, K extends keyof WebSocketEventMap>(
    host: string,
    type: K,
    data: Data,
  ) {
    const sockets = this.lookupSockets(host)
    const event = new MessageEventOverride(type, data)

    sockets.forEach((socket) => {
      socket.dispatchEvent(event)
    })
  }
}

export const webSocketStorage = new WebSocketStorage()
