import {Conversation} from './conversation';
import {Sequelize} from 'sequelize';

/**
 *
 */
export abstract class OnMessage implements Conversation {
  constructor(
    protected sequelize: Sequelize,
    protected bot: any
  ) {
  }
  abstract getPatterns(): string[];
  abstract getTypes(): string[];
  protected abstract onMessage(bot: any, message: any): void;

  start(): void {
    console.log('Message listening...%j', this.getPatterns());
    this.bot.botkit.hears(
      this.getPatterns(),
      this.getTypes(),
      this.onMessage.bind(this)
    );
  }
}
