import { EntityCard } from '@/components/ui/entitycard'
import { Paginator } from '@/components/ui/paginator'
import { getAllActorsQuery } from '@/llm/gateway'
import React from 'react'

export const generateStaticParams = async () => {
    const actorData = await getAllActorsQuery(0)
    const totalItems = Math.ceil(actorData.totalItems / 24)
    return Array.from({ length: totalItems }).map((_, i) => ({page: i + 2})) 
}

    


export default async function ActorPage({
    params
}: {
    params: { number: string }
}) {
    const page = Number(params.number || params.number || '1')
    const pageSize = 30
    const skip = (page - 1) * pageSize
    const actorsData = await getAllActorsQuery(skip)
    const totalItems = actorsData.totalItems

    return (
        <section>
            <h1 className='text-3xl my-5'>Actors</h1>
            <div className='min-h-[70vh] mb-4'>
                <div className='flex flex-wrap gap-4 '>
                    {
                        actorsData.actorsResults?.map((actor, i) => {
                            return <EntityCard
                                poster={actor.poster}
                                title={actor.name}
                                key={i}
                                entity={"actor"}
                            />

                        })
                    }

                </div>
            </div>
            <Paginator
                totalItems={totalItems}
                itemsPerPage={pageSize}
                currentPage={page}
                entity={"actor"}
            />
        </section>
    )
}