// SSE Connection Pool Manager
// Maintains a set of active SSE connections for broadcasting location updates

type SSEController = ReadableStreamDefaultController<string>;

class SSEConnectionManager {
  private connections: Set<SSEController> = new Set();

  add(controller: SSEController) {
    this.connections.add(controller);
  }

  remove(controller: SSEController) {
    this.connections.delete(controller);
  }

  broadcast(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const deadConnections: SSEController[] = [];

    this.connections.forEach((controller) => {
      try {
        controller.enqueue(message);
      } catch (error) {
        // Connection is dead, mark for removal
        deadConnections.push(controller);
      }
    });

    // Clean up dead connections
    deadConnections.forEach((controller) => {
      this.remove(controller);
    });
  }

  getConnectionCount() {
    return this.connections.size;
  }

  // Remove all connections (for cleanup)
  clear() {
    this.connections.clear();
  }
}

// Singleton instance
export const sseConnections = new SSEConnectionManager();

