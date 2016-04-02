import {IStorage} from '../storage';


export function createConversation(
  ctor: ConversationConstructor,
  storage: IStorage,
  controller: any) {
  return new ctor(storage, controller);
}

export interface ConversationConstructor {
  new(
    storage: IStorage,
    controller: any
  ): Conversation;
}
/**
 *
 */
export interface Conversation {
  start(): void;
}
