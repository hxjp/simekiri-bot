import {Conversation} from './conversation';
import {IStorage} from '../storage';

/**
 *
 */
export abstract class OnMessage implements Conversation {
  constructor(
    protected storage: IStorage,
    protected controller: any
  ) {
  }
  protected abstract getPatterns(): string[];
  protected abstract getTypes(): string[];
  protected abstract onMessage(bot: any, message: any);

  start(): void {
    console.log('Message listening...%j', this.getPatterns());
    this.controller.hears(
      this.getPatterns(),
      this.getTypes(),
      this.onMessage.bind(this)
    );
  }
}
