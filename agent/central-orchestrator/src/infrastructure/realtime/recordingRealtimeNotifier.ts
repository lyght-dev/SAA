import { type RealtimeMessage, type RealtimeNotifier } from "./realtimeNotifier.ts";

export class RecordingRealtimeNotifier implements RealtimeNotifier {
  readonly messages: RealtimeMessage[] = [];

  async notify(message: RealtimeMessage): Promise<void> {
    this.messages.push(structuredClone(message));
  }
}
