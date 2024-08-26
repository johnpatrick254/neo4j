import { EntityCard } from '@/components/ui/entitycard'
import { Paginator } from '@/components/ui/paginator'
import { getAllDirectorsQuery } from '@/llm/gateway'
import React from 'react'

export const generateStaticParams = async () => {
    const directorData = await getAllDirectorsQuery(0)
    const totalItems = Math.ceil(directorData.totalItems / 24)
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
    const directorsData = await getAllDirectorsQuery(skip)
    const totalItems = directorsData.totalItems

    return (
        <section>
            <h1 className='text-3xl my-5'>Directors</h1>
            <div className='min-h-[70vh] mb-4'>
                <div className='flex flex-wrap gap-4 '>
                    {
                        directorsData?.directorsResults?.map((director, i) => {
                            return <EntityCard
                                poster={director?.poster}
                                title={director?.name}
                                key={i}
                                entity={"director"}
                            />

                        })
                    }
                </div>
            </div>
            <Paginator
                totalItems={totalItems}
                itemsPerPage={pageSize}
                currentPage={page}
                entity={"movies"}
            />
        </section>
    )
}