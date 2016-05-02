import 'babel-polyfill';
import {createConversation, ALL_CONVERSATIONS}  from './conversations';
import * as Sequelize from 'sequelize';
import {defineModels} from './models';
import {Reminder} from './conversations/reminder';
const commandlineArgs = require('command-line-args');

const parser = commandlineArgs([
  {name: 'force', alias: 'F', type: Boolean,
    description: '強制的にDBスキーマを再作成するか'},
  {name: 'token', alias: 't', type: String, required: true,
    description: 'SlackのAPIトークン'},
  {name: 'reminder-channel', alias: 'c', type: String,
    description: 'リマインダを送信するチャネルの名称'},
  {name: 'help', alias: 'h', type: Boolean,
    description: 'ヘルプを表示する'},
  {name: 'database-url', alias: 'd', type: String, required: true,
    description: 'データベースのURL（例: mysql://user:pass@localhost:3306/hx）'},
]);

const options = parser.parse(process.argv);
// console.log(options);
if (options.help) {
  console.log(parser.getUsage());
  process.exit(0);
}
const token = options.token;
if (!token) {
  console.log('トークンが指定されていません' + parser.getUsage());
  process.exit(1);
}

const databaseUrl: string = options['database-url'];
if (!databaseUrl) {
  console.log('--database-urlが指定されていません' + parser.getUsage());
  process.exit(1);
}

// Sequelizeのトランザクションを、全てのクエリで自動的に利用する設定
// http://docs.sequelizejs.com/en/latest/docs/transactions/#automatically-pass-transactions-to-all-queries
const cls = require('continuation-local-storage');
Sequelize.cls = cls.createNamespace('hx');

const botkit = require('botkit');

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

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql'
});

defineModels(sequelize);
sequelize.sync({force: !!options.force});

for (const conversationClass of ALL_CONVERSATIONS) {
  let conversation;
  if (conversationClass === Reminder) {
    conversation = new Reminder(sequelize, bot, undefined, undefined, options['reminder-channel'] || undefined);
  } else {
    conversation = createConversation(conversationClass, sequelize, bot);
  }
  conversation.start();
}
