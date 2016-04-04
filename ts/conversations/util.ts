import * as moment from 'moment';
import {UserType} from '../constants';
import {Model} from 'sequelize';

export function formatSchedule(schedule: any, indent: string = '\t'): string {
  return `
${indent}ID:${schedule.id}
${indent}タイトル:${schedule.title}
${indent}シメキリ:${moment(schedule.deadline).format('YYYY/MM/DD')}
${indent}書く人: <@${schedule.writer.slackId}>
${indent}担当者: <@${schedule.editor.slackId}>
`;
}

export function findOrCreateUserBySlackId(User: Model<any, any>, slackId: string, type: UserType): Promise<any> {
  return User.findOrCreate({
      where: {slackId},
      defaults: {type}
    })
    .then(results => results[0]);
}
