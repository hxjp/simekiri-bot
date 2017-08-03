import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import {Conversation} from './conversation';
import {messages} from '../messages-ja';

export class OnHelpMessage extends OnMessage {
  private User: Model<any, any>;
  private Schedule: Model<any, any>;

  constructor(
    protected sequelize: Sequelize,
    protected bot: any
  ) {
    super(sequelize, bot);
    this.User = <any> sequelize.model('User');
    this.Schedule = <any> sequelize.model('Schedule');
  }
  getPatterns(): string[] {
    return ['^help'];
  }
  getTypes(): string[] {
    return ['direct_mention'];
  }

  protected onMessage(bot: any, message: any): void {
    const ALL_CONVERSATIONS: Conversation[] = require('./index').ALL_CONVERSATIONS;
    const commands: string[] = [];

    ALL_CONVERSATIONS.forEach((conv: any) => {
      if (typeof conv.prototype.getPatterns === 'function') {
        commands.push(conv.prototype.getPatterns().join('\n'));
      }
    });
    bot.reply(message, `${messages.availableCommands}:\n${commands.join('\n')}`);
  }
}
