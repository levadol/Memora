export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void;
}

export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  track(_event: AnalyticsEvent): void {
    // no-op — replace with real implementation later
  }
}

export const analytics = new NoopAnalyticsAdapter();
