"use client"

import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Paginator({ totalItems, itemsPerPage, currentPage, entity }) {
    const pathname = usePathname();
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const getPageNumbers = () => {
        const pageNumbers = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pageNumbers.push(1, 2, 3, 4, 5);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pageNumbers.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
            }
        }
        return pageNumbers;
    };

    const pageNumbers = getPageNumbers();

    const createPageURL = (pageNumber) => {
        const basePath = pathname.split('/page/')[0];
        return `${basePath}/page/${pageNumber}`;
    };

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <Link href={createPageURL(Math.max(1, currentPage - 1))}>
                        <PaginationPrevious
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                    </Link>
                </PaginationItem>

                {pageNumbers[0] > 1 && (
                    <>
                        <PaginationItem>
                            <Link href={createPageURL(1)}>
                                <PaginationLink>1</PaginationLink>
                            </Link>
                        </PaginationItem>
                        {pageNumbers[0] > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    </>
                )}

                {pageNumbers.map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                        <Link href={createPageURL(pageNumber)}>
                            <PaginationLink
                                isActive={currentPage === pageNumber}
                            >
                                {pageNumber}
                            </PaginationLink>
                        </Link>
                    </PaginationItem>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                        {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                        <PaginationItem>
                            <Link href={createPageURL(totalPages)}>
                                <PaginationLink>{totalPages}</PaginationLink>
                            </Link>
                        </PaginationItem>
                    </>
                )}

                <PaginationItem>
                    <Link href={createPageURL(Math.min(totalPages, currentPage + 1))}>
                        <PaginationNext
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                    </Link>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}