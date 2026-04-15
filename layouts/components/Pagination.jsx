import Link from "next/link";
import React from "react";
import { BsArrowRightShort, BsArrowLeftShort } from "react-icons/bs";

const Pagination = ({ section, currentPage, totalPages }) => {
  const indexPageLink = currentPage === 2;
  const hasPrevPage = currentPage > 1;
  const hasNextPage = totalPages > currentPage;

  const siblingCount = 1;

  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const paginationRange = React.useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 2);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPages - 1
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = range(1, 3 + siblingCount * 2);
      return [...leftRange, "dots-right", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightRange = range(
        totalPages - (3 + siblingCount * 2) + 1,
        totalPages
      );
      return [1, "dots-left", ...rightRange];
    }

    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, "dots-left", ...middleRange, "dots-right", totalPages];
  }, [currentPage, siblingCount, totalPages]);

  return (
    <>
      {totalPages > 1 && (
        <nav
          className="item-center mb-4 flex justify-center space-x-1 lg:space-x-2"
          aria-label="Pagination"
        >
          {/* previous */}
          {hasPrevPage ? (
            <Link
              href={
                indexPageLink
                  ? `${section ? "/" + section : "/"}`
                  : `${section ? "/" + section : ""}/page/${currentPage - 1}`
              }
              className="flex items-center rounded-full px-2 py-1 text-3xl font-bold leading-none text-dark dark:text-darkmode-light"
            >
              <>
                <BsArrowLeftShort />
                <span className="ml-3 text-lg ">Previous</span>
              </>
            </Link>
          ) : (
            <span className="flex items-center rounded-full px-2 py-1 text-3xl font-bold text-dark dark:text-darkmode-light ">
              <>
                <BsArrowLeftShort />
                <span className="ml-3 text-lg">Previous</span>
              </>
            </span>
          )}

          {/* page index */}
          {paginationRange.map((item, index) => {
            if (typeof item === "string") {
              return (
                <span
                  key={`dots-${index}`}
                  className="inline-flex h-[38px] w-[38px] items-center justify-center text-lg font-semibold text-dark dark:text-darkmode-light"
                >
                  &hellip;
                </span>
              );
            }

            const pageNumber = item;
            const isCurrent = pageNumber === currentPage;
            const href =
              pageNumber === 1
                ? `${section ? "/" + section : "/"}`
                : `${section ? "/" + section : ""}/page/${pageNumber}`;

            return isCurrent ? (
              <span
                key={`page-${pageNumber}`}
                aria-current="page"
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-primary bg-primary text-white shadow-md"
              >
                {pageNumber}
              </span>
            ) : (
              <Link
                key={`page-${pageNumber}`}
                href={href}
                aria-current="page"
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full px-4 py-1 font-secondary text-lg font-bold leading-none text-dark transition hover:bg-primary hover:text-white dark:text-darkmode-light"
              >
                {pageNumber}
              </Link>
            );
          })}

          {/* next page */}
          {hasNextPage ? (
            <Link
              href={`${section ? "/" + section : ""}/page/${currentPage + 1}`}
              className="ml-4 flex items-center rounded-full px-2 py-1 text-3xl font-bold leading-none text-dark dark:text-darkmode-light"
            >
              <>
                <span className="mr-3 text-lg">Next</span>
                <BsArrowRightShort />
              </>
            </Link>
          ) : (
            <span className="ml-4 flex items-center rounded-full px-2 py-1 text-3xl font-bold text-dark dark:text-darkmode-light">
              <>
                <span className="mr-3 text-lg">Next</span>
                <BsArrowRightShort />
              </>
            </span>
          )}
        </nav>
      )}
    </>
  );
};

export default Pagination;
