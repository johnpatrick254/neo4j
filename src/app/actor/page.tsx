import { EntityCard } from '@/components/ui/entitycard'
import { getAllActorsQuery } from '@/llm/gateway'
import React from 'react'

export default async function page() {
    const actors = await getAllActorsQuery(0)
    console.log(actors)

    return (
        <section>
            <h1 className='text-3xl my-5'>Directors</h1>
            <div className='flex flex-wrap gap-4'>
                {
                    actors?.map((actor, i) => {
                        return <EntityCard
                            poster={actor.poster}
                            title={actor.name}
                            key={i}
                            entity={"actor"}
                        />

                    })
                }
            </div>
        </section>
    )
}