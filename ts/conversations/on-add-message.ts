import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import {UserType, INPUT_DATE_FORMATS} from '../constants';
import {findOrCreateUserBySlackId, formatSchedule} from './util';

const commandlineArgs = require('command-line-args');
const moment = require('moment');

const usage = `
usage:
       add    [(-t | --title) <タイトル>]
              [(-d | --deadline) <シメキリ>]
              [(-w | --writer) @<書く人>]
              [(-e | --editor) @<担当者>]
`;

const parser = commandlineArgs([
  {name: 'title', alias: 't', type: String,
    description: '記事の仮タイトル'},
  {name: 'deadline', alias: 'd', type: String,
    description: `シメキリ。形式: ${INPUT_DATE_FORMATS.join(' or ')}`},
  {name: 'writer', alias: 'w', type: String},
]);

function parseMessage(line: string): {
  title: string;
  deadline: Date;
  writerSlackId: string;
} {
  const args = line.split(/\s/);
  const options = parser.parse(args);
  if (!options.title ||
    !options.deadline ||
    !options.writer) {
    throw new Error();
  }
  const deadline = moment(options.deadline, INPUT_DATE_FORMATS).toDate();
  let writerSlackId = options.writer;
  if (/\<\@(.+)\>/.test(writerSlackId)) {
    writerSlackId = RegExp.$1;
  }
  return {
    title: options.title,
    deadline,
    writerSlackId
  };
}

export class OnAddMessage extends OnMessage {
  private User: Model<any, any>;
  private Schedule: Model<any, any>;

  constructor(
    protected sequelize: Sequelize,
    protected controller: any
  ) {
    super(sequelize, controller);
    this.User = <any> sequelize.model('User');
    this.Schedule = <any> sequelize.model('Schedule');
  }
  getPatterns(): string[] {
    return ['^add (.+)'];
  }
  getTypes(): string[] {
    return ['direct_mention'];
  }

  protected onMessage(bot: any, message: any): void {
    const line: string = message.match[1];
    let params;
    try {
      params = parseMessage(line);
    } catch (e) {
      bot.reply(message, 'コマンド間違ってますよ\n' + usage);
      return;
    }
    this.sequelize.transaction(() => {
      const editorSlackId = message.user;
      return Promise.all([
        findOrCreateUserBySlackId(this.User, editorSlackId, UserType.EDITOR),
        findOrCreateUserBySlackId(this.User, params.writerSlackId, UserType.WRITER)
      ])
      .then((results: any[]) => {
        const editor = results[0];
        const writer = results[1];
        // const [editor, writer] = results;
        return this.Schedule.create({
          title: params.title,
          deadline: params.deadline,
          'writer_id': writer.get('id'),
          'editor_id': editor.get('id')
        })
          .then(schedule => {
            schedule.writer = writer;
            schedule.editor = editor;
            bot.reply(message, `シメキリが追加されました！\n${formatSchedule(schedule)}`);
          });
      });
    });
  }
}
