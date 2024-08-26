import { EntityCard } from '@/components/ui/entitycard'
import { Paginator } from '@/components/ui/paginator'
import { getAllMoviesQuery } from '@/llm/gateway'
import React from 'react'

export const generateStaticParams = async () => {
  const movieData = await getAllMoviesQuery(0)
  const totalItems = Math.ceil(movieData.totalItems / 24)
  return Array.from({ length: totalItems }).map((_, i) => ({ page: i + 2 }))
}

export default async function ActorPage({
  params
}: {
  params: { number: string }
}) {
  const page = Number(params.number || params.number || '1')
  const pageSize = 30
  const skip = (page - 1) * pageSize
  const moviesData = await getAllMoviesQuery(skip)
  const totalItems = moviesData.totalItems

  return (
    <section>
      <h1 className='text-3xl my-3'>Movies</h1>
      <div className='min-h-[70vh] mb-4'>
        <div className='flex flex-wrap gap-4'>
          {
            moviesData.moviesResults?.map((movie, i) => {
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
      </div>
      <div className='mt-8'>
        <Paginator
          totalItems={totalItems}
          itemsPerPage={pageSize}
          currentPage={page}
          entity={"movies"}
        />
      </div>
    </section>
  )
}