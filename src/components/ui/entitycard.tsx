import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter } from "./card"
import Link from "next/link"

export const EntityCard = async ({ title,poster,rating=null,votes=null,runtime=null,genres=null,entity})=>{
    return <Link href={`http://localhost:3000/${entity}/${title}`}>
        <Card className="h-60 w-44 shadow-md p-0.5 " >
            <CardContent className="p-1.5 h-3/4 relative text-xs">
                <Image
                    src={poster ? poster :"https://image.tmdb.org/t/p/w440_and_h660_face/8LRbYPUVLnFQMs86tg2YbmsGyKB.jpg"}
                    alt="entity-image"
                    height={50}
                    width={50}
                    className="h-full w-full"
                />
                <span className="absolute top-2 right-3">{genres && genres.split('|')[0]}</span>
                <span className="absolute bottom-2 right-3"> {runtime && runtime}</span>
            </CardContent>
            <CardFooter className="p-1.5">
                <CardDescription className=" flex flex-col items-start gap-y-1 text-xs">
                    <p className="truncate text-ellipsis w-40">{title}</p>
                    <div className="flex justify-between">
                        <p> {rating && `Rating: ${rating}`}</p>
                    <p>{votes && votes}</p>
                    </div>

                </CardDescription>
            </CardFooter>
        </Card>
    </Link>
}