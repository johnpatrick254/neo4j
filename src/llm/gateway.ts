import { Message } from "@/utils/types"
import { Neo4jDB } from "./neo4j"


//
// FETCH INDIVIDUAL ENTITES
//
export const movieQuery = async (title: string) => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()

        const movies = await session.run(
            `
            MATCH (m:Movie {title: "${title}"})<-[:ACTED_IN]-(a:Actor)
            MATCH (m)<-[:DIRECTED]-(d:Director)
            WITH m as movie, collect(DISTINCT a.name) AS actors,collect(DISTINCT d.name)  AS directors
            RETURN movie{.*, actors:actors,directors:directors}
            `
        )
        return movies?.records[0]?.get('movie')
    }
}

export const actorQueries = async (name: string) => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()

        const actors = await session.run(
            `
            MATCH (a:Actor {name: "${name}"})-[r:ACTED_IN]->(m:Movie)
            OPTIONAL MATCH (a)-[:DIRECTED]->(d:Movie)
            WITH a , 
                collect(DISTINCT {title: m.title, role: r.role}) AS actedInMovies,
                collect( DISTINCT d.title) AS directedMovies
            RETURN a{.*, actedInMovies: actedInMovies, directedMovies: directedMovies} AS actor
            `
        )
        return actors?.records[0]?.get('actor')
    }
}

export const directorQueries = async (name: string) => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()
        const directorsQuery = await session.run(
            `
            MATCH (d:Director {name: $name})-[:DIRECTED]->(m:Movie)
            OPTIONAL MATCH (d)-[r:ACTED_IN]->(a:Movie)
            WITH d,
                collect(DISTINCT m.title) AS directedMovies,
                collect({title: a.title, role: r.role}) AS actedInMovies
            RETURN d{.*,directedMovies: directedMovies,actedInMovies: actedInMovies
            } AS director
            `,
            { name }
        )

        const directors = directorsQuery.records[0].get('director')

        return directors
    }
}

//
// BULK FETCH ENTITIES
//

type getAllMoviesQueryResponse = {
    imdbRating: number,
    title: string,
    genres: string,
    imdbVotes: number,
    poster: string,
    runtime: number
}

export const getAllMoviesQuery = async (skip: number) => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()
        const moviesQuery = await session.run(
            `
            MATCH (m:Movie)
            RETURN m{
            .title,
            .imdbRating,
            .runtime,
            .imdbVotes,
            .poster,
            .genres
            } AS movie

            SKIP toInteger($skip)
            LIMIT 24
                
            `,
            { skip }
        )

        const moviesResults: getAllMoviesQueryResponse[] = moviesQuery?.records?.map(record => record?.get('movie'))
        const totalItems = (await session.run(`
             MATCH(m:Movie) 
              RETURN COUNT(m) as total;
                
            `)).records[0].get('total')
        await session.close()
        return { totalItems, moviesResults }
    }
}

type getAllActorsQueryResponse = {
    name: string,
    poster: string
}

export const getAllActorsQuery = async (skip: number) => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()
        const actorsQuery = await session.run(
            `
            MATCH (a:Actor)
            RETURN a{
            .name,
            .poster
            } AS actor

            SKIP toInteger($skip)
            LIMIT 24
            `,
            { skip }
        )
        const totalItems = (await session.run(`
             MATCH(a:Actor) 
              RETURN COUNT(a) as total;
                
            `)).records[0].get('total')
        const actorsResults: getAllActorsQueryResponse[] = actorsQuery?.records?.map(record => record?.get('actor'))
        await session.close()
        return { totalItems, actorsResults }
    }
}

type getAllDirectorsQueryResponse = {
    name: string,
    poster: string
}

export const getAllDirectorsQuery = async (skip: number) => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()
        const directorsQuery = await session.run(
            `
            MATCH (d:Director)
            RETURN d{
            .name,
            .poster
            } AS director

            SKIP toInteger($skip)
            LIMIT 24;
            `,
            { skip }
        )

        const totalItems = (await session.run(`
             MATCH(d:Director) 
              RETURN COUNT(d) as total;
                
            `)).records[0].get('total')
        const directorsResults: getAllDirectorsQueryResponse[] = directorsQuery?.records?.map(record => record?.get('director'))

        await session.close()
        return { totalItems, directorsResults }
    }
}


// 
// STATIC PARAM GENERATORS
//
export const actorQueryStaticParams = async () => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()

        const actors = await session.run(
            `
            MATCH (a:Actor)-[:ACTED_IN]->(m:Movie)
            RETURN a.name as name
            `
        )

        const actorNames = actors.records.map(record => ({ name: record.get('name') }))
        await session.close()
        return actorNames;
    }
}

export const directorQueryStaticParams = async () => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()

        const director = await session.run(
            `
            MATCH (d:Director)-[:DIRECTED]->(m:Movie)
            RETURN d.name as name
            `
        )

        const directorNames = director.records.map(record => ({ name: record.get('name') }))
        await session.close()
        return directorNames;
    }
}
export const movieQueryStaticParams = async () => {
    const driver = await new Neo4jDB().getConnection()

    if (driver) {
        const session = driver.session()
        const movies = await session.run(
            `
            MATCH (m:Movie)
            RETURN m.title as title
            `,
        )
        const movieTitles = movies.records.map(record => ({ name: record.get('title') }))
        await session.close()
        return movieTitles;
    }
}


export const getSessionMessages = async (sessionId: string) => {
    const driver = await new Neo4jDB().getConnection()
    if (driver) {
        const session = driver.session()

        const messageQuery = await session.run(
            `
            MATCH (:Session {id: $sessionId})-[:LAST_RESPONSE]->(last)
            MATCH path = (start)-[:NEXT*0..25]->(last)
            WHERE length(path) = 5 OR NOT EXISTS { ()-[:NEXT]->(start) }
            UNWIND nodes(path) AS response
            RETURN response.id AS id,
            response.input AS input,
            response.output AS output,
            response.retry AS retry,
            response.initialResponseId AS initialResponseId,
            response.createdAt AS createdAt
            ORDER BY response.createdAt ASC
            `,
            { sessionId }
        )

        const messageMap: { [key: string]: Message } = {}
        const messages: Message[] = []

        messageQuery.records.forEach((record) => {
            const query: Message = {
                text: record.get('input'),
                _id: record.get('id'),
                isUserMessage: true
            }
            const response: Message = {
                text: record.get('output'),
                _id: record.get('id'),
                isUserMessage: false
            }

            if (record.get('retry')) {
                const initialResponseId = record.get('initialResponseId')
                if (messageMap[initialResponseId]) {
                    if (!messageMap[initialResponseId].previousResponse) {
                        messageMap[initialResponseId].previousResponse = []
                    }
                    // Check if the response is already in the previousResponse array
                    const isDuplicate = messageMap[initialResponseId].previousResponse!.some(
                        prevResponse => prevResponse._id === response._id
                    )
                    if (!isDuplicate) {
                        messageMap[initialResponseId].previousResponse!.unshift(response)
                    }
                }
            } else {
                messages.push(query, response)
                messageMap[response._id] = response
            }
        })

        await session.close()
        return messages.reverse()
    }
    return []
}