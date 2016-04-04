import {Conversation} from './conversation';
import {Sequelize} from 'sequelize';

/**
 *
 */
export abstract class OnMessage implements Conversation {
  constructor(
    protected sequelize: Sequelize,
    protected controller: any
  ) {
  }
  protected abstract getPatterns(): string[];
  protected abstract getTypes(): string[];
  protected abstract onMessage(bot: any, message: any): void;

  start(): void {
    console.log('Message listening...%j', this.getPatterns());
    this.controller.hears(
      this.getPatterns(),
      this.getTypes(),
      this.onMessage.bind(this)
    );
  }
}
