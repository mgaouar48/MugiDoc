import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Banknote, CreditCard, Check, AlertCircle, Printer } from "lucide-react";
import { Payment } from "../../../shared/types";
import { computeCollection } from "./collectMath";

/** Valeurs remontées à la validation du formulaire. */
export interface CollectFormResult {
  /** Montant total de l'acte / de la facture. */
  total: number;
  /** Somme encaissée lors de CE versement. */
  paidNow: number;
  /** Cumul réglé après ce versement (versements antérieurs inclus). */
  totalPaid: number;
  /** Reste à payer après ce versement — valeur à écrire dans `debt_amount`. */
  debt: number;
  method: "cash" | "card";
  status: Payment["status"];
  printReceipt: boolean;
}

export interface PaymentCollectFormProps {
  /** Montant total pré-rempli. */
  initialTotal: string;
  /**
   * Somme déjà réglée lors de versements ANTÉRIEURS. Sans elle, un patient
   * ayant déjà versé un acompte se voyait redemander la totalité de la facture.
   */
  alreadyPaid?: number;
  initialMethod?: "cash" | "card";
  initialPrintReceipt?: boolean;
  /** Libellé du montant total : « facture » côté relance, « acte » côté consultation. */
  totalLabel?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (result: CollectFormResult) => void;
  /** Remet les champs à leur valeur initiale quand la fenêtre se rouvre. */
  resetKey?: unknown;
}

const AMOUNT_PRESETS = [1500, 2000, 2500, 3000];

const toNumber = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const formatDA = (n: number) => `${n.toLocaleString("fr-FR")} DA`;

/**
 * Corps commun des deux fenêtres d'encaissement (relance d'un impayé et
 * encaissement rapide en fin de consultation).
 *
 * Trois quantités distinctes, à ne pas confondre :
 *  - `total`       : montant de l'acte ;
 *  - `alreadyPaid` : ce que le patient a réglé lors de passages précédents ;
 *  - `paidNow`     : ce qu'il règle aujourd'hui.
 *
 * Le reste à payer vaut `total - alreadyPaid - paidNow` et alimente
 * `debt_amount`, dont c'est le sens canonique (voir `Payment`).
 */
export const PaymentCollectForm = ({
  initialTotal,
  alreadyPaid = 0,
  initialMethod = "cash",
  initialPrintReceipt = false,
  totalLabel = "Montant total",
  isSubmitting,
  onCancel,
  onSubmit,
  resetKey,
}: PaymentCollectFormProps) => {
  const [amount, setAmount] = useState<string>(initialTotal);
  const [method, setMethod] = useState<"cash" | "card">(initialMethod);
  const [isPartial, setIsPartial] = useState<boolean>(false);
  const [partialInput, setPartialInput] = useState<string>("");
  const [printReceipt, setPrintReceipt] = useState<boolean>(initialPrintReceipt);


  useEffect(() => {
    setAmount(initialTotal);
    setMethod(initialMethod);
    setIsPartial(false);
    setPartialInput("");
    setPrintReceipt(initialPrintReceipt);
    // `resetKey` change à chaque ouverture : les valeurs initiales sont alors
    // réappliquées même si elles sont identiques à la fois précédente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Règlement total = solder ce qu'il reste, pas refacturer l'acte entier.
  const {
    total,
    priorPaid,
    outstandingBefore,
    paidNow,
    totalPaid,
    debt: remainingAfter,
    status,
    exceeds: paidNowExceeds,
  } = computeCollection({
    total: toNumber(amount),
    alreadyPaid,
    payingNow: isPartial ? toNumber(partialInput) : null,
  });

  const canSubmit = total > 0 && !paidNowExceeds && !isSubmitting;

  const partialPresets = Array.from(
    new Set(
      [
        Math.round(outstandingBefore / 2),
        1000,
        2000,
        outstandingBefore,
      ].filter((v) => v > 0 && v <= outstandingBefore)
    )
  ).sort((a, b) => a - b);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ total, paidNow, totalPaid, debt: remainingAfter, method, status, printReceipt });
  };

  const submitLabel = isSubmitting
    ? "Validation..."
    : paidNow > 0
      ? `Encaisser ${formatDA(paidNow)}`
      : "Enregistrer sans encaisser";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">

      {/* ─── 1. Montant total de l'acte ─── */}
      <div className="space-y-1.5">
        <label htmlFor="collectTotal" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {totalLabel}
        </label>
        <div className="relative">
          <Input
            id="collectTotal"
            type="number"
            step="100"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="2000"
            className="h-10 text-base font-bold font-mono text-center pr-10 text-foreground"
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
            DA
          </span>
        </div>

        {priorPaid === 0 && (
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {AMOUNT_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={`py-1 text-xs font-mono rounded border transition-colors text-center ${
                  amount === val.toString()
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {val.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 2. Situation du dossier (uniquement s'il y a un historique) ─── */}
      {priorPaid > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Déjà réglé</span>
            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              {formatDA(priorPaid)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reste dû</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
              {formatDA(outstandingBefore)}
            </span>
          </div>
        </div>
      )}

      {/* ─── 3. Montant encaissé aujourd'hui ─── */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsPartial(false)}
            className={`py-1.5 rounded-md transition-all text-center flex items-center justify-center gap-1.5 ${
              !isPartial
                ? "bg-background text-foreground shadow-2xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Solder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPartial(true);
              if (partialInput === "") setPartialInput("0");
            }}
            className={`py-1.5 rounded-md transition-all text-center flex items-center justify-center gap-1.5 ${
              isPartial
                ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Versement partiel</span>
          </button>
        </div>

        {!isPartial ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              Encaissé aujourd'hui
            </span>
            <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {formatDA(outstandingBefore)}
            </span>
          </div>
        ) : (
          <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center justify-between">
              <label htmlFor="collectPaidNow" className="text-[11px] text-foreground font-semibold">
                Versé aujourd'hui
              </label>
              <span className="text-[11px] text-muted-foreground">
                max {formatDA(outstandingBefore)}
              </span>
            </div>

            <div className="relative">
              <Input
                id="collectPaidNow"
                type="number"
                step="100"
                min="0"
                max={outstandingBefore}
                value={partialInput}
                onChange={(e) => setPartialInput(e.target.value)}
                placeholder="0"
                className="h-9 text-sm font-bold font-mono pr-10 text-foreground"
                aria-invalid={paidNowExceeds}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                DA
              </span>
            </div>

            {partialPresets.length > 0 && (
              <div className="grid grid-cols-4 gap-1">
                {[0, ...partialPresets].slice(0, 4).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPartialInput(val.toString())}
                    className={`py-0.5 text-[11px] font-mono rounded border transition-colors text-center ${
                      partialInput === val.toString()
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {val.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
            )}

            {paidNowExceeds && (
              <p className="text-[11px] text-destructive font-medium">
                Le versement ne peut pas dépasser le reste dû ({formatDA(outstandingBefore)}).
              </p>
            )}

            <div className="p-2.5 rounded-md border bg-amber-500/10 border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">
                  Restera à régler
                </span>
                <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                  {formatDA(remainingAfter)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">Statut final</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    status === "pending"
                      ? "bg-muted text-foreground"
                      : status === "debt"
                        ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                        : "bg-emerald-500/20 text-emerald-700"
                  }`}
                >
                  {status === "pending" ? "En attente" : status === "debt" ? "Dette (partiel)" : "Soldé"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Mode de règlement ─── */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Mode de règlement
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("cash")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              method === "cash"
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Espèces</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              method === "card"
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Carte / chèque</span>
          </button>
        </div>
      </div>

      {/*
        ─── 5. Barre d'actions ───
        L'option d'impression modifie ce que fait l'action principale : elle
        lui est rattachée plutôt que posée seule au milieu du formulaire.
      */}
      <div className="pt-3 border-t border-border space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground w-fit">
          <input
            type="checkbox"
            checked={printReceipt}
            onChange={(e) => setPrintReceipt(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
          />
          <span>Imprimer le ticket (80 mm)</span>
        </label>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 h-10 text-sm font-semibold gap-1.5"
          >
            {printReceipt ? <Printer className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};
