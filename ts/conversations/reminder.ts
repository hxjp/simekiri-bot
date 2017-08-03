import {Sequelize, Model} from 'sequelize';
import * as moment from 'moment';
import {Conversation} from './conversation';
import {ScheduleStatus} from '../constants';
import {formatSchedule} from './util';
import {messages} from '../messages-ja';
import * as util from 'util';
const {CronJob} = require('cron');
const CRON_TIMINGS = '00 08 * * * *';

export interface ReminderTask {
  getKind(): string;
  shouldSendReminder(schedule: any): Promise<boolean>;
  getNotificationMessage(schedule: any): string;
}

export class BasicReminderTask implements ReminderTask {
  constructor(
    private reminderDateRelative: number
  ) {
  }
  getKind(): string {
    return this.reminderDateRelative + 'd';
  }
  protected isNotifyTiming(schedule: any): boolean {
    const reminderDate =
      moment(schedule.deadline)
        .add(this.reminderDateRelative, 'd');
    return reminderDate.isSame(new Date(), 'd');
  }
  shouldSendReminder(schedule: any): Promise<boolean> {
    if (schedule.sent) {
      return Promise.resolve(false);
    }
    if (!this.isNotifyTiming(schedule)) {
      return Promise.resolve(false);
    }
    const notifications: any[] = schedule.notifications;
    for (let notification of notifications) {
      // 既に通知済み
      if (notification.kind === this.getKind()) {
        return Promise.resolve(false);
      }
    }
    return Promise.resolve(true);
  }
  getNotificationMessage(schedule: any): string {
    const reminderDateRel = this.reminderDateRelative;
    let message: string;
    if (reminderDateRel === 0) {
      message = `${messages.remindMessageToday}`;
    } else if (reminderDateRel < -5) {
      message = util.format(messages.remindMessageBefore1, `${Math.abs(reminderDateRel)}日`);
    } else if (reminderDateRel < -2) {
      message = util.format(messages.remindMessageBefore2, `${Math.abs(reminderDateRel)}日`);
    } else if (reminderDateRel > 2) {
      message = util.format(messages.remindMessageAfter1, `${Math.abs(reminderDateRel)}日`);
    } else {
      message = util.format(messages.remindMessageAfter2, `${Math.abs(reminderDateRel)}日`);
    }
    return `
<@${schedule.writer.slackId}>${message}
${formatSchedule(schedule)}
    `;
  }
}

const DEFAULT_REMINDER_TASKS: ReminderTask[] = [
  new BasicReminderTask(-7), // 1週間前
  new BasicReminderTask(-3), // 3日前
  new BasicReminderTask(0),  // シメキリ当日
  new BasicReminderTask(2),  // 2日後
];

export class Reminder implements Conversation {
  private User: Model<any, any>;
  private Schedule: Model<any, any>;
  private Notification: Model<any, any>;

  constructor(
    private sequelize: Sequelize,
    private bot: any,
    private reminderTasks: ReminderTask[] = DEFAULT_REMINDER_TASKS,
    private job?: any,
    private targetSlackChannel: string = '#bot-test'
  ) {
    this.User = <any> sequelize.model('User');
    this.Schedule = <any> sequelize.model('Schedule');
    this.Notification = <any> sequelize.model('Notification');
    if (this.job) {
      this.job.addCallback(this.onTick.bind(this));
    } else {
      this.job = new CronJob({
        cronTime: CRON_TIMINGS,
        onTick: this.onTick.bind(this),
        start: false,
        timezone: 'Asia/Tokyo'
      });
    }
  }

  start(): void {
    this.job.start();
  }

  onTick(): Promise<any> {
    // 1週間前, 3日前, 前日, 締切翌日に通知
    // 有効な締切一つ一つに対して、現在日時が通知日時を過ぎていないかをチェックし、
    // 過ぎていたら、通知済みじゃないかどうかをチェックし、
    // 未通知だったら通知を行う。
    return this.Schedule.findAll({
      where: {
        status: ScheduleStatus.ACTIVE
      },
      include: [
        {model: this.Notification, as: 'notifications'},
        {model: this.User, as: 'writer'},
        {model: this.User, as: 'editor'},
      ]
    })
      .then(schedules => {
        return this._sendAll(schedules);
      });
  }
  private _sendAll(schedules: any[]): Promise<any> {
    const self = this;
    return (async function(): Promise<any[]> {
      const notifications: any[] = [];
      for (let schedule of schedules) {
        for (let reminderTask of self.reminderTasks) {
          const shouldSend = await reminderTask.shouldSendReminder(schedule);
          if (shouldSend) {
            notifications.push(await self.sendReminder(schedule, reminderTask));
            schedule.sent = true;
          }
        }
      }
      return notifications;
    })();
  }
  private sendReminder(schedule: any, reminderTask: ReminderTask): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.bot.sendWebhook({
        text: reminderTask.getNotificationMessage(schedule),
        channel: this.targetSlackChannel
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    })
      .then(() => {
        return this.Notification.create({
          schedule_id: schedule.id,
          notifiedAt: new Date(),
          kind: reminderTask.getKind()
        });
      });
  }
}
