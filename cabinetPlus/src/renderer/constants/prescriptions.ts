/**
 * Nombre maximum de médicaments par ordonnance.
 *
 * Contrainte de mise en page : au-delà, l'ordonnance imprimée déborde d'une
 * page. Valeur unique et partagée — elle divergeait auparavant selon l'écran
 * (6 dans le formulaire de médicaments, 8 dans l'ordonnance et les modèles,
 * aucune limite dans l'ordonnance rapide, pourtant le chemin le plus utilisé).
 */
export const MAX_MEDICATIONS = 6;
