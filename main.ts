import { GoogleCalendar } from './src/calendar.ts'
import { SkyscannerClient } from './src/skyscanner.ts'

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
    name: 'checkAvailability',
    description: [
        'Check availability for the given date.',
        'The date should be in the format YYYY-MM-DD.',
        'The date should be in the future.',
    ].join('\n'),
    parameters: z.object({
        date: z.string().date().describe('Date to check availability for'),
    }),
    execute: async ({ date }) => {
        const data = await GoogleCalendar.GetAvailabilityForDay({ date })
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
        description: z.string().describe('Additional details about the flight'),
        start: z.string().date().describe('Start dateTime of the event in ISO 8601 format'),
        end: z.string().date().describe('End dateTime of the event in ISO 8601 format'),
    }),
    execute: async ({ summary, description, start, end }) => {
        const data = await GoogleCalendar.CreateEvent({ summary, description, start, end })
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
