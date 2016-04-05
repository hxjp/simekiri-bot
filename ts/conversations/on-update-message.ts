import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import * as moment from 'moment';
import {INPUT_DATE_FORMATS, UserType} from '../constants';
import {formatSchedule} from './util';

const usage = `
usage:
       update (-i | --id) <id>
              [(-t | --title) <タイトル>]
              [(-d | --deadline) <シメキリ>]
              [(-w | --writer) @<書く人>]
              [(-e | --editor) @<担当者>]
`;

const commandlineArgs = require('command-line-args');
const parser = commandlineArgs([
  {name: 'id', alias: 'i', type: String},
  {name: 'title', alias: 't', type: String},
  {name: 'deadline', alias: 'd', type: String},
  {name: 'writer', alias: 'w', type: String},
  {name: 'editor', alias: 'e', type: String},
]);
function parseMessage(line: string): {
  id: string;
  title: string;
  deadline: Date;
  writerSlackId: string;
  editorSlackId: string;
} {
  const args = line.split(/\s/);
  const options = parser.parse(args);
  if (!options.id) {
    throw new Error();
  }
  let id = parseInt(options.id, 10);
  if (!id) {
    throw new Error();
  }
  let deadline;
  if (options.deadline) {
    deadline = moment(options.deadline, INPUT_DATE_FORMATS).toDate();
  }
  let writerSlackId = options.writer;
  if (writerSlackId) {
    if (/\<\@(.+)\>/.test(writerSlackId)) {
      writerSlackId = RegExp.$1;
    } else {
      throw new Error();
    }
  }
  let editorSlackId = options.editor;
  if (editorSlackId) {
    if (/\<\@(.+)\>/.test(editorSlackId)) {
      editorSlackId = RegExp.$1;
    } else {
      throw new Error();
    }
  }
  return {
    id: options.id,
    title: options.title,
    deadline,
    writerSlackId,
    editorSlackId,
  };
}

export class OnUpdateMessage extends OnMessage {
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
    return ['^update (.+)'];
  }
  getTypes(): string[] {
    return ['direct_mention'];
  }

  protected onMessage(bot: any, message: any): void {
    console.log('update message:', message);
    const line: string = message.match[1];
    let params;
    try {
      params = parseMessage(line);
    } catch (e) {
      bot.reply(message, 'コマンド間違ってますよ\n' + usage);
      return;
    }
    const {id, title, deadline, editorSlackId, writerSlackId} = params;
    this.sequelize.transaction(() => {
      let schedule;
      return this.Schedule.findById(params.id, {
        include: [
          {model: this.User, as: 'writer'},
          {model: this.User, as: 'editor'}
        ]})
        .then(sche => {
          if (!sche) {
            bot.reply(message, `IDが不正です:[${id}]`);
            return Promise.reject(new Error('IDが不正です'));
          }
          schedule = sche;
          if (title) {
            schedule.title = title;
          }
          if (deadline) {
            schedule.deadline = deadline;
          }
          const queries = [];
          if (editorSlackId) {
            queries.push(this.User['findOrCreateUserBySlackId'](editorSlackId, UserType.EDITOR));
          }
          if (writerSlackId) {
            queries.push(this.User['findOrCreateUserBySlackId'](writerSlackId, UserType.WRITER));
          }
          if (queries.length > 0) {
            return Promise.all(queries)
              .then(results => {
                const [editor, writer] = results;
                if (editor) {
                  schedule.editor = editor;
                  schedule.editor_id = editor.id;
                }
                if (writer) {
                  schedule.writer = writer;
                  schedule.writer_id = writer.id;
                }
              });
          }
        })
        .then(() => {
          return schedule.save()
            .then(() => {
              return bot.reply(message, `シメキリが更新されました。\n${formatSchedule(schedule)}`);
            });
        });
    });
  }
}
