import { z } from 'npm:zod'

import dayjs from 'npm:dayjs'
import utc from 'npm:dayjs/plugin/utc.js'
import timezone from 'npm:dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const DateTimeWithTimezone = z.object({
    dateTime: z.string().describe('Start dateTime of the event in ISO 8601 format, local time, without time zone or offset'),
    timeZone: z.string().describe('Time zone of the flight, use the airport time zone in the tz format'),
}).transform((data) => {
    const date = dayjs.tz(data.dateTime, data.timeZone)
    if (!date.isValid()) throw new Error('Invalid date')
    return { dateTime: date.toISOString(), timeZone: data.timeZone }
})
