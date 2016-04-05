import {Sequelize} from 'sequelize';


export function createConversation(
  ctor: ConversationConstructor,
  sequelize: Sequelize,
  bot: any): Conversation {
  return new ctor(sequelize, bot);
}

export interface ConversationConstructor {
  new(
    sequelize: Sequelize,
    bot: any
  ): Conversation;
}
/**
 *
 */
export interface Conversation {
  start(): void;
}
