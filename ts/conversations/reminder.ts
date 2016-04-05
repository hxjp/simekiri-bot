import {Sequelize, Model} from 'sequelize';
import * as moment from 'moment';
import {Conversation} from './conversation';
import {ScheduleStatus} from '../constants';
const {CronJob} = require('cron');
import {formatSchedule} from './util';
const CRON_TIMINGS = '00 08 * * * *';

interface ReminderTask {
  getKind(): string;
  shouldSendReminder(schedule: any): Promise<boolean>;
}

class BasicReminderTask implements ReminderTask {
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
    // Notificationテーブル
    // schedule_id, type("-1w", "-3d", "-1d", "1d"), notifiedAt
    const notifications: any[] = schedule.getSchedules();
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
    let dateStr: string;
    if (reminderDateRel === 0) {
      dateStr = '当日';
    } else if (reminderDateRel < 0) {
      dateStr = `${Math.abs(reminderDateRel)}日前`;
    } else if (reminderDateRel > 0) {
      dateStr = `${Math.abs(reminderDateRel)}日後`;
    }
    return `
<@${schedule.writer.slackId}>【リマインダー】シメキリ${dateStr}です！執筆の状況はいかがですか？
${formatSchedule(schedule)}
    `;
  }
}

const REMINDER_TASKS: ReminderTask[] = [
  new BasicReminderTask(-7), // 1週間前
  new BasicReminderTask(-3), // 3日前
  new BasicReminderTask(0),  // シメキリ当日
  new BasicReminderTask(2),  // 2日後
];

export class Reminder implements Conversation {
  private job: any;
  private User: Model<any, any>;
  private Schedule: Model<any, any>;
  private Notification: Model<any, any>;

  constructor(
    private sequelize: Sequelize,
    private bot: any
  ) {
    this.User = <any> sequelize.model('User');
    this.Schedule = <any> sequelize.model('Schedule');
    this.Notification = <any> sequelize.model('Notification');

    this.job = new CronJob({
      cronTime: CRON_TIMINGS,
      onTick: this.onTick.bind(this),
      start: false,
      timezone: 'Asia/Tokyo'
    });
  }

  start(): void {
    this.job.start();
  }

  onTick(): Promise<any> {
    // const now = new Date();
    // 1週間前, 3日前, 前日, 締切翌日に通知
    // 有効な締切一つ一つに対して、現在日時が通知日時を過ぎていないかをチェックし、
    // 過ぎていたら、通知済みじゃないかどうかをチェックし、
    // 未通知だったら通知を行う。
    return this.Schedule.findAll({
      where: {
        status: ScheduleStatus.ACTIVE
      },
      include: [
        {model: this.Notification},
        {model: this.User, as: 'writer'},
        {model: this.User, as: 'editor'},
      ]
    })
      .then(schedules => {
        this._sendAll(schedules);
      });
  }
  private _sendAll(schedules: any[]): Promise<any> {
    const self = this;
    return (async function(): Promise<any[]> {
      const notifications: any[] = [];
      for (let schedule of schedules) {
        for (let reminderTask of REMINDER_TASKS) {
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
        text: 'Hello from reminder',
        channel: '#bot-test'
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
