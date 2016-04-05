import 'babel-polyfill';
import {createConversation, ALL_CONVERSATIONS}  from './conversations';
import * as Sequelize from 'sequelize';
import {defineModels} from './models';

// Sequelizeのトランザクションを、全てのクエリで自動的に利用する設定
// http://docs.sequelizejs.com/en/latest/docs/transactions/#automatically-pass-transactions-to-all-queries
const cls = require('continuation-local-storage');
Sequelize.cls = cls.createNamespace('hx');

const botkit = require('botkit');

const token = process.env.token;
if (!token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = botkit.slackbot({
  debug: false
});

const bot = controller.spawn({
  token,
  incoming_webhook: {
    url: 'https://hooks.slack.com/services/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'
  }
})
  .startRTM(function(err: any): void {
    if (err) {
      throw new Error(err);
    }
  });

const sequelize = new Sequelize('hx', 'shumpei', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

defineModels(sequelize);
sequelize.sync({force: true});

for (const conversationClass of ALL_CONVERSATIONS) {
  const conversation = createConversation(conversationClass, sequelize, bot);
  conversation.start();
}


