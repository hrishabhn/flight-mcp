import dayjs from 'npm:dayjs'
import utc from 'npm:dayjs/plugin/utc.js'
import timezone from 'npm:dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export function parseLocalDate({ dateTime, timeZone }: { dateTime: string; timeZone: string }) {
    const date = dayjs.tz(dateTime, timeZone)
    if (!date.isValid()) throw new Error('Invalid date')
    return { dateTime: date.toISOString(), timeZone }
}
