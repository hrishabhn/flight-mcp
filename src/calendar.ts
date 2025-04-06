import dayjs from 'npm:dayjs'
import { google } from 'npm:googleapis'

// init environment variables
const credentialsJson = Deno.env.get('GOOGLE_SERVICE_KEY')
if (!credentialsJson) throw new Error('GOOGLE_SERVICE_KEY is not set')
const credentials = JSON.parse(credentialsJson)

const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')
if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID is not set')

// google calendar api
const serviceAccount = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/calendar'] })
google.options({ auth: serviceAccount })

export class GoogleCalendar {
    static GetAvailabilityForDay = async ({ date }: { date: string }) => {
        const data = await google.calendar('v3').events.list({
            calendarId,
            timeMin: dayjs(date).startOf('day').subtract(1, 'day').toISOString(),
            timeMax: dayjs(date).endOf('day').add(1, 'day').toISOString(),
        })

        return data.data.items?.map((event) => ({
            title: event.summary,
            start: event.start?.dateTime,
            end: event.end?.dateTime,
        })) || []
    }

    static CreateEvent = async ({
        summary,
        description,
        start,
        end,
    }: {
        summary: string
        description: string
        start: string
        end: string
    }) => {
        const { data } = await google.calendar('v3').events.insert({
            calendarId,
            requestBody: {
                summary,
                description,
                start: { dateTime: start },
                end: { dateTime: end },
            },
        })

        return data
    }
}
