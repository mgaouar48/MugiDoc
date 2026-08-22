import React from 'react';
import { Button } from './button';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  canGoPrevious,
  canGoNext,
  startIndex,
  endIndex,
  totalItems,
  className = ""
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Si le nombre total de pages est petit, afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <Button
              variant={currentPage === i ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(i)}
              className="w-8 h-8"
            >
              {i}
            </Button>
          </PaginationItem>
        );
      }
    } else {
      // Logique pour afficher les pages avec ellipses
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      // Première page
      if (startPage > 1) {
        pages.push(
          <PaginationItem key={1}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              className="w-8 h-8"
            >
              1
            </Button>
          </PaginationItem>
        );
        
        if (startPage > 2) {
          pages.push(
            <PaginationItem key="ellipsis-start">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
      }

      // Pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={i}>
            <Button
              variant={currentPage === i ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(i)}
              className="w-8 h-8"
            >
              {i}
            </Button>
          </PaginationItem>
        );
      }

      // Dernière page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(
            <PaginationItem key="ellipsis-end">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
        
        pages.push(
          <PaginationItem key={totalPages}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8"
            >
              {totalPages}
            </Button>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Informations sur les éléments affichés */}
      <div className="text-sm text-muted-foreground">
        Affichage de {startIndex + 1} à {endIndex} sur {totalItems} éléments
      </div>

      {/* Contrôles de pagination */}
      <Pagination>
        <PaginationContent>
          {/* Bouton Précédent */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrevious}
              className="gap-1 pl-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
          </PaginationItem>

          {/* Numéros de page */}
          {renderPageNumbers()}

          {/* Bouton Suivant */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className="gap-1 pr-2.5"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
