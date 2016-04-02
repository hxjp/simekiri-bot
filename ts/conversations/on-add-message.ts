import {IStorage} from '../storage';
import {OnMessage} from './on-message';
import {format} from 'util';
import {User, UserType, UserRepository} from '../models/user';
import {Schedule, ScheduleRepository} from '../models/schedule';
import * as _ from 'lodash';

const commandlineArgs = require('command-line-args');
const moment = require('moment');

const ALLOWED_DATE_FORMATS = ['YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD', 'MM/DD'];

const usage = `
usage:
       add [-t | --title] <タイトル>
           [-d | --deadline] <シメキリ>
           [-w | --writer] @<書く人>
`;

const parser = commandlineArgs([
  {name: 'title', alias: 't', type: String,
    description: '記事の仮タイトル'},
  {name: 'deadline', alias: 'd', type: String,
    description: `シメキリ。形式: ${ALLOWED_DATE_FORMATS.join(' or ')}`},
  {name: 'writer', alias: 'w', type: String},
]);

function parseMessage(line: string): {
  title: string;
  deadline: Date;
  writerSlackId: string;
} {
  const args = line.split(/\s/);
  try {
    const options = parser.parse(args);
    if (!options.title ||
      !options.deadline ||
      !options.writer) {
      throw new Error();
    }
    const deadline = moment(options.deadline, ALLOWED_DATE_FORMATS).toDate();
    let writerSlackId = options.writer;
    if (/\<\@(.+)\>/.test(writerSlackId)) {
      writerSlackId = RegExp.$1;
    }
    return {
      title: options.title,
      deadline,
      writerSlackId
    };
  } catch (e) {
    throw e;
  }
}

export class OnAddMessage extends OnMessage {
  private userRepository: UserRepository;
  private scheduleRepository: ScheduleRepository;

  constructor(
    protected storage: IStorage,
    protected controller: any
  ) {
    super(storage, controller);
    this.userRepository = new UserRepository(storage);
    this.scheduleRepository = new ScheduleRepository(storage);
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
    const editorSlackId = message.user;
    Promise.all([
      this.userRepository.findOrCreateBySlackId(editorSlackId, UserType.EDITOR),
      this.userRepository.findOrCreateBySlackId(params.writerSlackId)
    ])
      .then(results => {
        const [editor, writer] = results;
        const schedule = new Schedule();
        _.extend(schedule, {
          title: params.title,
          deadline: params.deadline,
          writer,
          editor
        });
        return schedule.save(this.storage).then(() => schedule);
      })
      .then(schedule => {
        bot.reply(message, format('Add command received: %j', schedule));
      });
  }
}
