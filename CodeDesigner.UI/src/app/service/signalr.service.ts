import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection;

  public messages: string[] = [];

  constructor() { }

  public startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:53367/ws') // Adjust port & path as needed
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('[SignalR] Connection started'))
      .catch(err => console.error('[SignalR] Error while starting connection: ', err));
  }

  public sendAssemblerMessage(message: { filePath: string; source: string }): Promise<any> {
    return this.hubConnection.invoke<any>('SendAssemblerMessage', message);
  }
}
