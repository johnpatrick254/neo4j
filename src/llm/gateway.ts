import { Neo4jDB } from "./neo4j"


export const movieQuery = async(title:string) =>{
    const driver = await new Neo4jDB().getConnection()

    if(driver){
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


export const actorQueries = async (name: string)=>{
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
            {name}
        )

        const directors = directorsQuery.records[0].get('director')
        
        return directors
    }
}
 type getAllMoviesQueryResponse = {
    imdbRating: number,
    title: string,
    genres: string,
    imdbVotes: number,
    poster:string,
    runtime: number
}
export const getAllMoviesQuery= async(skip:number)=>{
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
            LIMIT 30
                
            `,
            { skip }
        )

        const moviesResults: getAllMoviesQueryResponse[] = moviesQuery?.records?.map(record=>record?.get('movie'))
        console.log(moviesResults)

        return moviesResults
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
            LIMIT 30
            `,
            { skip }
        )

        const actorsResults: getAllActorsQueryResponse[] = actorsQuery?.records?.map(record => record?.get('actor'))
        console.log(actorsResults)

        return actorsResults
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
            LIMIT 30
                
            `,
            { skip }
        )

        const directorsResults: getAllDirectorsQueryResponse[] = directorsQuery?.records?.map(record => record?.get('director'))
        console.log(directorsResults)

        return directorsResults
    }
}