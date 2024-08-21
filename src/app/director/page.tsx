import { EntityCard } from '@/components/ui/entitycard'
import { getAllDirectorsQuery } from '@/llm/gateway'
import React from 'react'

export default async function page() {
    const directors = await getAllDirectorsQuery(0)
    console.log(directors)

    return (
        <section>
            <h1 className='text-3xl my-5'>Directors</h1>
            <div className='flex flex-wrap gap-4'>
                {
                    directors?.map((director, i) => {
                        return <EntityCard
                            poster={director?.poster}
                            title={director?.name}
                            key={i}
                            entity={"director"}
                        />

                    })
                }
            </div>
        </section>
    )
}