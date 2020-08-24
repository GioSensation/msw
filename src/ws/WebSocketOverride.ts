import { webSocketStorage } from './webSocketStorage'
import { createCloseEvent } from './utils/createCloseEvent'

export class WebSocketOvereride extends EventTarget implements WebSocket {
  [k: string]: any

  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  binaryType: BinaryType = 'blob'

  readonly CLOSED = WebSocket.CLOSED
  readonly CLOSING = WebSocket.CLOSING
  readonly CONNECTING = WebSocket.CONNECTING
  readonly OPEN = WebSocket.OPEN

  private _bufferedAmount = 0
  private _extensions = ''
  private _protocol = ''
  private _readyState = WebSocket.CONNECTING
  private _url = ''

  private _onclose: ((event: CloseEvent) => any) | null = null
  private _onerror: ((event: Event) => any) | null = null
  private _onmessage: ((event: MessageEvent) => any) | null = null
  private _onopen: ((event: Event) => any) | null = null

  private attachEventListener<
    K extends keyof WebSocketEventMap,
    L extends EventListener
  >(type: K, listener: L | null) {
    if (this[`_on${type}`]) {
      this.removeEventListener(type, this[`_on${type}`])
      this[`_on${type}`] = null
    }

    if (listener) {
      this.addEventListener(type, listener)
      this[`_on${type}`] = listener
    }
  }

  constructor(url: string, protocols?: string[] | string) {
    super()

    const urlRecord = new URL(url)

    // Validate WebSocket URL protocol.
    if (!['wss:', 'ws:'].includes(urlRecord.protocol)) {
      throw new Error(
        `SyntaxError: Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or 'wss'. '${urlRecord.protocol}' is not allowed.`,
      )
    }

    // Forbid fragments (hashes) in the WebSocket URL.
    if (urlRecord.hash) {
      throw new Error(
        `SyntaxError: Failed to construct 'WebSocket': The URL contains a fragment identifier ('${urlRecord.hash}'). Fragment identifiers are not allowed in WebSocket URLs.`,
      )
    }

    this._url = urlRecord.toString()

    /**
     * @todo This constructor is not finished.
     */

    webSocketStorage.addSocket(this, this.url)

    // Look up if there is a WebSocket link created to intercept
    // events to this WebSocket URL.
    const link = webSocketStorage.lookupLink(url)

    if (!link) {
      /**
       * @todo Create an original `WebSocket` instance that would operate as usual.
       * Need a reference to the unpatched `WebSocket` class.
       */
      console.error('No `ws.link` called for this URL: %s', url)

      setImmediate(() => {
        this._readyState = WebSocket.CLOSED
        webSocketStorage.removeSocket(this, this.url)
        this.dispatchEvent(
          createCloseEvent({ type: 'close', target: this, code: 1000 }),
        )
      })

      return
    }

    setImmediate(() => {
      this._readyState = WebSocket.OPEN
      const openEvent = new Event('open')
      Object.defineProperty(openEvent, 'target', {
        writable: false,
        value: this,
      })
      this.dispatchEvent(openEvent)
    })
  }

  get url() {
    return this._url
  }

  get protocol() {
    return this._protocol
  }

  get bufferedAmount() {
    return this._bufferedAmount
  }

  get extensions() {
    return this._extensions
  }

  get readyState() {
    return this._readyState
  }

  get onclose() {
    return this._onclose
  }

  set onclose(listener) {
    this.attachEventListener('close', listener as EventListener)
  }

  get onopen() {
    return this._onopen
  }

  set onopen(listener) {
    this.attachEventListener('open', listener)
  }

  get onmessage() {
    return this._onmessage
  }

  set onmessage(listener) {
    this.attachEventListener('message', listener as EventListener)
  }

  get onerror() {
    return this._onerror
  }

  set onerror(listener) {
    this.attachEventListener('error', listener)
  }

  /**
   * Transmits data using the WebSocket connection.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.readyState === WebSocket.CONNECTING) {
      webSocketStorage.removeSocket(this, this.url)
      throw new Error('InvalidStateError')
    }

    if ([WebSocket.CLOSING, WebSocket.CLOSED].includes(this.readyState)) {
      const dataLength = getDataLength(data)
      this._bufferedAmount += dataLength
      return
    }

    /**
     * @todo
     * Trigger `ws.on()` listener of the MSW.
     */
  }

  close(code = 1000, reason?: string) {
    if (!code || !(code === 1000 || (code >= 3000 && code < 5000))) {
      throw new Error(
        'InvalidAccessError: close code out of user configurable range',
      )
    }

    if ([WebSocket.CLOSING, WebSocket, this.CLOSED].includes(this.readyState)) {
      return
    }

    this._readyState = WebSocket.CLOSING
    webSocketStorage.removeSocket(this, this.url)

    const closeEvent = createCloseEvent({ target: this, code, reason })
    this.dispatchEvent(closeEvent)

    /** @todo */
    //
  }
}

function getDataLength(
  data: string | ArrayBufferLike | Blob | ArrayBufferView,
): number {
  if (typeof data === 'string') {
    return data.length
  }

  if (data instanceof Blob) {
    return data.size
  }

  return data.byteLength
}
