import { EntityCard } from '@/components/ui/entitycard'
import { getAllMoviesQuery } from '@/llm/gateway'
import React from 'react'

export default async function page() {
    const movies= await getAllMoviesQuery(0)
    console.log(movies)

  return (
    <section>
     <h1 className='text-3xl my-3'>Movies</h1>
    <div className='flex flex-wrap gap-4'>
        {
          movies?.map((movie,i)=>{
            return <EntityCard
            genres={movie?.genres}
            poster={movie?.poster}
            runtime={movie?.runtime}
            rating={movie?.imdbRating}
            title={movie?.title}
            votes={movie?.imdbVotes}
            key={i}
            entity={"movies"}
            />
            
          })
        }
    </div>
        </section>
  )
}
