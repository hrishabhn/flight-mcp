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

type EventTime = {
    dateTime: string
    timeZone: string
}

export class GoogleCalendar {
    static GetAvailability = async ({ timeMin, timeMax }: { timeMin: string; timeMax: string }): Promise<{ available: boolean }> => {
        const { data } = await google.calendar('v3').events.list({ calendarId, timeMin, timeMax })
        return { available: !data.items?.length }
    }

    static CreateEvent = async ({
        summary,
        description,
        start,
        end,
    }: {
        summary: string
        description: string
        start: EventTime
        end: EventTime
    }) => {
        const { data } = await google.calendar('v3').events.insert({
            calendarId,
            requestBody: { summary, description, start, end },
        })

        return data
    }
}
