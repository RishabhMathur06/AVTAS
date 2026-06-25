class AIWebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.callbacks = {};
    this.isConnected = false;
    this.pendingQueue = [];
  }

  connect(onConnect) {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected to AI Backend');
      this.isConnected = true;
      if (onConnect) onConnect();
      
      // Flush pending
      while (this.pendingQueue.length > 0) {
        this.ws.send(this.pendingQueue.shift());
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.callbacks[message.type]) {
          this.callbacks[message.type](message);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from AI Backend. Reconnecting in 2s...');
      this.isConnected = false;
      setTimeout(() => this.connect(onConnect), 2000);
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };
  }

  on(type, callback) {
    this.callbacks[type] = callback;
  }

  send(type, payload = {}) {
    const data = JSON.stringify({ type, ...payload });
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.pendingQueue.push(data);
    }
  }
}

// Singleton instance
export const aiClient = new AIWebSocketClient('ws://127.0.0.1:8000/ws');
