import http from '@/api/http';
import { ScheduleCondition } from '@/api/server/schedules/getScheduleConditions';

export default (uuid: string, scheduleId: number, conditions: ScheduleCondition[], logicOperator: 'AND' | 'OR'): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/schedules/${scheduleId}/conditions`, {
            conditions,
            logic_operator: logicOperator,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
