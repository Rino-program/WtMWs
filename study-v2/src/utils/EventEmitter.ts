/**
 * シンプルなEventEmitter実装
 */

import { EventListener, IEventEmitter, EventName, EventDataMap } from '@/types/events';

export class EventEmitter implements IEventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  /**
   * イベントリスナーを登録
   */
  on<K extends EventName>(event: K, listener: EventListener<EventDataMap[K]>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener as EventListener);
  }

  /**
   * イベントリスナーを解除
   */
  off<K extends EventName>(event: K, listener: EventListener<EventDataMap[K]>): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener as EventListener);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * イベントを発火
   */
  emit<K extends EventName>(event: K, data: EventDataMap[K]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 一度だけ実行されるイベントリスナーを登録
   */
  once<K extends EventName>(event: K, listener: EventListener<EventDataMap[K]>): void {
    const onceWrapper: EventListener<EventDataMap[K]> = (data) => {
      this.off(event, onceWrapper);
      listener(data);
    };
    this.on(event, onceWrapper);
  }

  /**
   * 全てのイベントリスナーを解除
   */
  removeAllListeners(event?: EventName): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 特定のイベントのリスナー数を取得
   */
  listenerCount(event: EventName): number {
    return this.events.get(event)?.size ?? 0;
  }
}
