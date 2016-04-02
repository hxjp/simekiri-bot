import {createConversation, Conversation, ConversationConstructor, OnAddMessage}  from './conversations';
import {MemoryStorage} from './storage';

require('./storage/mysql');

const botkit = require('botkit');

const storage = new MemoryStorage();

const token = process.env.token;
if (!token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = botkit.slackbot({
  debug: false
});

controller.spawn({token})
  .startRTM(function(err) {
    if (err) {
      throw new Error(err);
    }
  });

controller.on('direct_mention', (bot: any, message) => {
  console.log('direct_mention received! ', message);
});

const conversations: ConversationConstructor[] = [
  OnAddMessage
];

for (const conversationClass of conversations) {
  const conversation = createConversation(conversationClass, storage, controller);
  conversation.start();
}


