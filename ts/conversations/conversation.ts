import {Sequelize} from 'sequelize';


export function createConversation(
  ctor: ConversationConstructor,
  sequelize: Sequelize,
  controller: any): Conversation {
  return new ctor(sequelize, controller);
}

export interface ConversationConstructor {
  new(
    sequelize: Sequelize,
    controller: any
  ): Conversation;
}
/**
 *
 */
export interface Conversation {
  start(): void;
}
