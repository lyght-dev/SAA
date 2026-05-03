export type RealtimeMessage = {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
};

export type RealtimeNotifier = {
  notify(message: RealtimeMessage): Promise<void>;
};
