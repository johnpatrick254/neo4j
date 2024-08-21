import { directorQueries } from "@/llm/gateway";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
    "title":'Directors'
}

export default async function Director({ params }: { params: { name: string } }) {
    const directorName = params.name.replace(/%20/g, ' ')
     
    const directorData = await directorQueries(directorName);
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL

    console.log(directorData)


    return (<>
        <main className="flex min-h-screen flex-col items-center justify-between px-24 py-8">
            {
                !directorData ?
                    <div>
                        <p>Sorry , director not found!</p>
                    </div>
                    :
                    <section className="flex flex-col gap-y-4">
                        <h1 className="text-3xl font-bold">{directorData.name}</h1>
                        <div className="flex gap-3">
                            <div className=" space-y-4 w-1/2">
                                <p >{directorData.bio}</p>
                                <h2 className="text-2xl font-bold">Movies</h2>
                                <h3 className="text-xl font-bold">Acted in</h3>
                                <div className="flex flex-col my-2 gap-y-2">
                                    <div className="flex-wrap">

                                        {
                                            directorData.actedInMovies.map((movie, i) => {
                                                return <p key={i}> <Link href={`${baseURL}/movies/${movie.title}`}> <span className="underline mx-1">{movie.title} </span> {movie.role && <span>- played as {movie.role}</span>}</Link></p>
                                            })
                                        }
                                    </div>
                                </div>
                                <div className="flex flex-col my-2 gap-y-2">
                                    <h3 className="text-xl font-bold">Directed in</h3>
                                    <div className="flex flex-nowrap gap-4">

                                        {
                                            directorData.directedMovies.map((movie, i) => <p key={i}> <Link className="underline" href={`${baseURL}/movies/${movie}`}>{movie} </Link></p>)
                                        }

                                    </div>
                                </div>
                            </div>
                            <div className="h-80 w-80">
                                <Image
                                    src={directorData.poster ? directorData.poster : "https://image.tmdb.org/t/p/w440_and_h660_face/8LRbYPUVLnFQMs86tg2YbmsGyKB.jpg"}
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
