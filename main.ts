import { SkyscannerClient } from './src/skyscanner.ts'
import { GoogleCalendar } from './src/calendar.ts'
import { parseLocalDate } from './src/util.ts'

import { FastMCP } from 'npm:fastmcp'
import { z } from 'npm:zod'

const server = new FastMCP({
    name: 'Flight MCP',
    version: '1.0.0',
})

server.addTool({
    name: 'getDate',
    description: [
        'Get the current date.',
        'Use this to get the current date if the user has not specified the year of travel.',
    ].join('\n'),
    parameters: z.object({}),
    // deno-lint-ignore require-await
    execute: async () => new Date().toISOString(),
})

server.addTool({
    name: 'flightsAutoComplete',
    description: [
        'Get airport data from the given query.',
        'The airport data will contain a city name and code.',
        'The code will be three letters long for airports and four letters long for cities.',
        'If the user has specified the airport, select the specified airport, otherwise select the city or first matching airport.',
        'If there is ambiguity, the user should be prompted to select the airport.',
    ].join('\n'),
    parameters: z.object({
        query: z.string().describe('Airport or city name'),
    }),
    execute: async ({ query }) => {
        const data = await SkyscannerClient.get('/flights/auto-complete', { queries: { query } })
        return JSON.stringify(data.inputSuggest.map((item) => item.navigation.relevantFlightParams), null, 2)
    },
})

server.addTool({
    name: 'flightsOneWay',
    description: [
        'Get one-way flight data from the given query.',
        'Present the results in tabular format.',
    ].join('\n'),
    parameters: z.object({
        date: z.string().date().describe('Departure date'),
        origin: z.string().describe('Can be retrieved from flights/auto-complete endpoint (navigation -> relevantFlightParams -> skyId)'),
        originId: z.string().describe('Can be retrieved from flights/auto-complete endpoint (navigation -> relevantFlightParams -> entityId)'),
        destination: z.string().describe('Can be retrieved from flights/auto-complete endpoint (navigation -> relevantFlightParams -> skyId)'),
        destinationId: z.string().describe('Can be retrieved from flights/auto-complete endpoint (navigation -> relevantFlightParams -> entityId)'),
    }),
    execute: async ({ date, origin, originId, destination, destinationId }) => {
        const data = await SkyscannerClient.get('/flights/one-way/list', { queries: { date, origin, originId, destination, destinationId } })
        return JSON.stringify(data.data.itineraries.buckets, null, 2)
    },
})

server.addTool({
    name: 'hotelsAutoComplete',
    description: [
        'Get hotel places from the given query.',
        'The hotel data will contain a place class, entityName, and entityId.',
    ].join('\n'),
    parameters: z.object({
        query: z.string().describe('Place name'),
    }),
    execute: async ({ query }) => {
        const data = await SkyscannerClient.get('/hotels/auto-complete', { queries: { query } })
        return JSON.stringify(data, null, 2)
    },
})

server.addTool({
    name: 'hotelsList',
    description: [
        'Get hotel data from the given query.',
        'Present the results in tabular format.',
    ].join('\n'),
    parameters: z.object({
        entity_id: z.string().describe('Can be retrieved from hotels/auto-complete endpoint (data -> entityId)'),
        checkin: z.string().date().describe('Check-in date'),
        checkout: z.string().date().describe('Check-out date'),
    }),
    execute: async ({ entity_id, checkin, checkout }) => {
        const data = await SkyscannerClient.get('/hotels/list', { queries: { entity_id, checkin, checkout } })
        return JSON.stringify(data, null, 2)
    },
})

server.addTool({
    name: 'checkAvailability',
    description: [
        'Check availability for the given time period.',
        'The start should be the start of the first segment of the journey.',
        'The end should be the end of the last segment of the journey.',
    ].join('\n'),
    parameters: z.object({
        start: z.object({
            dateTime: z.string().describe('Start dateTime of the first segment in ISO 8601 format, local event time, without time zone or offset'),
            timeZone: z.string().describe('Time zone of the first segment departure, use the airport time zone in the tz format'),
        }),
        end: z.object({
            dateTime: z.string().describe('End dateTime of the last segment in ISO 8601 format, local event time, without time zone or offset'),
            timeZone: z.string().describe('Time zone of the last segment arrival, use the airport time zone in the tz format'),
        }),
    }),
    execute: async ({ start, end }) => {
        const data = await GoogleCalendar.GetAvailability({ timeMin: parseLocalDate(start).dateTime, timeMax: parseLocalDate(end).dateTime })
        return JSON.stringify(data, null, 2)
    },
})

server.addTool({
    name: 'addFlightToCalendar',
    description: [
        'Add a flight to the calendar.',
    ].join('\n'),
    parameters: z.object({
        summary: z.string().describe("Flight details in the format: 'CX 321 - HKG to BCN'"),
        description: z.string().describe('Additional details about the flight such as leg number'),
        start: z.object({
            dateTime: z.string().describe('Start dateTime of the event in ISO 8601 format, local event time, without time zone or offset'),
            timeZone: z.string().describe('Time zone of the flight departure, use the airport time zone in the tz format'),
        }),
        end: z.object({
            dateTime: z.string().describe('End dateTime of the event in ISO 8601 format, local event time, without time zone or offset'),
            timeZone: z.string().describe('Time zone of the flight arrival, use the airport time zone in the tz format'),
        }),
    }),
    execute: async ({ summary, description, start, end }) => {
        const data = await GoogleCalendar.CreateEvent({ summary, description, start: parseLocalDate(start), end: parseLocalDate(end) })
        return JSON.stringify(data, null, 2)
    },
})

server.start({
    transportType: 'sse',
    sse: {
        endpoint: '/',
        port: 8080,
    },
})
