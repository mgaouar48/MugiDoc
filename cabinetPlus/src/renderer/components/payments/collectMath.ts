import { Payment } from "../../../shared/types";

export interface CollectionInput {
  /** Montant total de l'acte / de la facture. */
  total: number;
  /** Somme réglée lors de versements ANTÉRIEURS à celui-ci. */
  alreadyPaid: number;
  /**
   * Somme encaissée aujourd'hui. `null` = mode « solder » : on encaisse
   * automatiquement tout ce qu'il reste dû.
   */
  payingNow: number | null;
}

export interface CollectionOutcome {
  total: number;
  /** Part déjà réglée, bornée à [0, total]. */
  priorPaid: number;
  /** Reste dû AVANT le versement du jour. */
  outstandingBefore: number;
  /** Somme réellement encaissée aujourd'hui. */
  paidNow: number;
  /** Cumul réglé après ce versement. */
  totalPaid: number;
  /** Reste à payer APRÈS ce versement — valeur à écrire dans `debt_amount`. */
  debt: number;
  status: Payment["status"];
  /** Vrai si la saisie dépasse le reste dû (saisie à refuser). */
  exceeds: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Règle de calcul d'un encaissement.
 *
 * Trois quantités distinctes, que le code confondait auparavant : le montant
 * total de l'acte, ce qui a déjà été réglé lors de passages précédents, et ce
 * qui est encaissé aujourd'hui. Sans la deuxième, un patient ayant versé un
 * acompte se voyait redemander la totalité de la facture.
 *
 * `debt` suit le sens canonique de `debt_amount` : le RESTE À PAYER.
 */
export const computeCollection = ({
  total,
  alreadyPaid,
  payingNow,
}: CollectionInput): CollectionOutcome => {
  const safeTotal = Number.isFinite(total) && total > 0 ? round2(total) : 0;
  const priorPaid = round2(Math.min(Math.max(alreadyPaid, 0), safeTotal));
  const outstandingBefore = round2(Math.max(0, safeTotal - priorPaid));

  const requested = payingNow === null
    ? outstandingBefore
    : Number.isFinite(payingNow)
      ? Math.max(0, payingNow)
      : 0;

  const exceeds = requested > outstandingBefore;
  const paidNow = round2(Math.min(requested, outstandingBefore));

  const totalPaid = round2(priorPaid + paidNow);
  const debt = round2(Math.max(0, safeTotal - totalPaid));

  const status: Payment["status"] =
    debt === 0 && safeTotal > 0 ? "completed" : totalPaid > 0 ? "debt" : "pending";

  return { total: safeTotal, priorPaid, outstandingBefore, paidNow, totalPaid, debt, status, exceeds };
};

/**
 * Part déjà encaissée d'un paiement existant, déduite de `debt_amount`
 * (= reste à payer). Vaut 0 pour un paiement qui n'est pas une dette.
 */
export const priorPaidOf = (payment: Pick<Payment, "amount" | "status" | "debt_amount"> | null): number => {
  if (!payment || payment.status !== "debt" || payment.debt_amount === undefined) return 0;
  return round2(Math.max(0, payment.amount - payment.debt_amount));
};
