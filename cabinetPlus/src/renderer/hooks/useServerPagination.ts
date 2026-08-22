interface UseServerPaginationReturn {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  offset: number;
}

/**
 * Même forme de retour que usePagination.ts, mais calculée à partir d'un total
 * fourni par le serveur (COUNT SQL) plutôt que de la longueur d'un tableau local.
 * Permet de réutiliser PaginationControls tel quel avec des données paginées côté serveur.
 */
export function useServerPagination(
  total: number,
  currentPage: number,
  goToPageFn: (page: number) => void,
  pageSize = 10
): UseServerPaginationReturn {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      goToPageFn(page);
    }
  };

  const nextPage = () => {
    if (canGoNext) goToPageFn(currentPage + 1);
  };

  const previousPage = () => {
    if (canGoPrevious) goToPageFn(currentPage - 1);
  };

  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems: total,
    offset: startIndex
  };
}
