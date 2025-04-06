import { z } from 'npm:zod'
import { Zodios } from 'npm:@zodios/core'

const SkyscannerClient = new Zodios('https://skyscanner89.p.rapidapi.com', [
    {
        method: 'get',
        path: '/flights/auto-complete',
        parameters: [
            {
                name: 'query',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
        ],
        response: z.object({
            inputSuggest: z.array(z.object({
                navigation: z.object({
                    relevantFlightParams: z.object({
                        entityId: z.string(),
                        localizedName: z.string(),
                        skyId: z.string(),
                    }),
                }),
            })),
        }),
    },
    {
        method: 'get',
        path: '/flights/one-way/list',
        parameters: [
            {
                name: 'date',
                type: 'Query',
                required: true,
                schema: z.string().date(),
            },
            {
                name: 'origin',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
            {
                name: 'originId',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
            {
                name: 'destination',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
            {
                name: 'destinationId',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
        ],
        response: z.object({
            status: z.literal('success'),
            data: z.object({
                itineraries: z.object({
                    buckets: z.array(z.object({
                        id: z.string(),
                        items: z.array(z.unknown()),
                    })),
                }),
            }),
        }),
    },
    {
        method: 'get',
        path: '/hotels/auto-complete',
        parameters: [
            {
                name: 'query',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
        ],
        response: z.array(z.unknown()),
    },
    {
        method: 'get',
        path: '/hotels/list',
        parameters: [
            {
                name: 'entity_id',
                type: 'Query',
                required: true,
                schema: z.string(),
            },
            {
                name: 'checkin',
                type: 'Query',
                required: true,
                schema: z.string().date(),
            },
            {
                name: 'checkout',
                type: 'Query',
                required: true,
                schema: z.string().date(),
            },
        ],
        response: z.object({
            results: z.object({
                hotelCards: z.array(z.object({
                    name: z.string(),
                    cheapestPrice: z.string(),
                    stars: z.string(),
                })),
            }),
        }),
    },
])

SkyscannerClient.axios.defaults.headers.common['x-rapidapi-key'] = Deno.env.get('SKYSCANNER_API_KEY')
SkyscannerClient.axios.defaults.headers.common['x-rapidapi-host'] = 'skyscanner89.p.rapidapi.com'

export { SkyscannerClient }
