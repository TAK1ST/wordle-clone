import { WebSocketMessage } from '../types';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve(this.socket!);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect(url);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}