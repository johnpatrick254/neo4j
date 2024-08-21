import { directorQueries, movieQuery } from "@/llm/gateway";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
    "title": 'Movie'
}

export default async function Movie({ params }: { params: { title: string } }) {
    const movieName = params.title.replace(/%20/g, ' ')

    const movieData = await movieQuery(movieName);

    console.log(movieData)


    return (<>
        <main className="flex min-h-screen flex-col items-center justify-between px-24 py-8">
            {
                !movieData
                    ?
                    <div>
                        <p>Sorry, movie not found!</p>
                    </div>
                    :
                    <section className="flex flex-col gap-y-4">
                        <div className="flex gap-3">
                            <div className="w-1/2 space-y-3">
                                <h1 className="text-3xl font-bold">{movieData.title}</h1>
                                <p>{movieData.plot}</p>
                                <div className="font-bold text-sm">
                                    <p>Runtime: {movieData.runtime}m</p>
                                    <p>Rating: {movieData.imdbRating}</p>
                                    <p>Genre: {movieData.genres}</p>
                                </div>
                                <h2 className="text-2xl font-bold">Cast</h2>

                                <div className="flex gap-5">
                                    <div className="flex flex-col justify-start">
                                        <h3 className="text-xl font-bold">Actors</h3>
                                        <div className="flex flex-col flex-wrap gap-y-1.5">
                                            {
                                                movieData.actors.map((actor, i) => <p key={i}> <Link className="underline" href={`http://localhost:3000/actor/${actor}`}>{actor} </Link></p>)
                                            }
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-start">
                                        <h3 className="text-xl font-bold">Directors</h3>
                                        <div className="flex flex-col flex-nowrap gap-y-1.5">

                                            {
                                                movieData.directors.map((director, i) => <p key={i}> <Link className="underline" href={`http://localhost:3000/director/${director}`}>{director} </Link></p>)
                                            }

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80 w-80">
                                <Image
                                    src={movieData.poster ? movieData.poster : "https://image.tmdb.org/t/p/w440_and_h660_face/8LRbYPUVLnFQMs86tg2YbmsGyKB.jpg"}
                                    alt="entity-image"
                                    height={50}
                                    width={50}
                                    className="h-full w-full"
                                />
                            </div>
                        </div>
                    </section>
            }
        </main>
    </>
    );
}
