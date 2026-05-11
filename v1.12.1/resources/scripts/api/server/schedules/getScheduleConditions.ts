import http from '@/api/http';

export interface ScheduleCondition {
    variable: 'players_count' | 'cpu_usage' | 'memory_usage' | 'uptime';
    operator: '==' | '>' | '<' | '>=' | '<=' | '!=';
    value: number;
}

export interface ScheduleConditionsResponse {
    conditions: ScheduleCondition[];
    logic_operator: 'AND' | 'OR';
}

export default (uuid: string, scheduleId: number): Promise<ScheduleConditionsResponse> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/schedules/${scheduleId}/conditions`)
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
