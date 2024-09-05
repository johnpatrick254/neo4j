import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter } from "./card"
import Link from "next/link"

export const EntityCard = async ({ title, poster, rating = null, votes = null, runtime = null, genres = null, entity }) => {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL

    return <Card className="h-52 w-44 shadow-md p-0.5 " >
        <Link href={`${baseURL}/${entity}/${title}`}>
            <CardContent className="p-1.5 h-3/4 relative text-xs">
                <Image
                    src={poster ? poster : "https://image.tmdb.org/t/p/w440_and_h660_face/8LRbYPUVLnFQMs86tg2YbmsGyKB.jpg"}
                    alt="entity-image"
                    height={50}
                    width={50}
                    className="h-full w-full transition-all ease-in-out duration-0 object-cover hover:scale-105 "
                />
            </CardContent>
            <CardFooter className="p-1.5">
                <CardDescription className=" flex flex-col items-start gap-y-1 text-xs">
                    <p className="truncate text-black font-semibold text-ellipsis w-40">{title}</p>
                    <div className="flex gap-3 justify-between">
                        <p> {rating && `Rating: ${Math.floor(rating)}`}</p>
                        <p>{runtime && `Time:${(parseInt(runtime) * 10) + 'm'}`}</p>
                    </div>

                </CardDescription>
            </CardFooter>
        </Link>
    </Card>
}

