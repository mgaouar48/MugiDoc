import { describe, it, expect } from "vitest";
import { computeCollection, priorPaidOf } from "./collectMath";

describe("computeCollection", () => {
  it("solde un acte neuf en une fois", () => {
    const r = computeCollection({ total: 2000, alreadyPaid: 0, payingNow: null });
    expect(r.outstandingBefore).toBe(2000);
    expect(r.paidNow).toBe(2000);
    expect(r.debt).toBe(0);
    expect(r.status).toBe("completed");
  });

  it("enregistre un acompte sur un acte neuf", () => {
    const r = computeCollection({ total: 2500, alreadyPaid: 0, payingNow: 1500 });
    expect(r.paidNow).toBe(1500);
    expect(r.debt).toBe(1000);
    expect(r.status).toBe("debt");
  });

  it("ne réclame que le reste dû quand un acompte a déjà été versé", () => {
    // Cas signalé : facture 2500, 1500 déjà réglés, il reste 1000.
    const r = computeCollection({ total: 2500, alreadyPaid: 1500, payingNow: null });
    expect(r.outstandingBefore).toBe(1000);
    expect(r.paidNow).toBe(1000); // et surtout pas 2500
    expect(r.totalPaid).toBe(2500);
    expect(r.debt).toBe(0);
    expect(r.status).toBe("completed");
  });

  it("accepte un second versement partiel", () => {
    const r = computeCollection({ total: 2500, alreadyPaid: 1500, payingNow: 400 });
    expect(r.outstandingBefore).toBe(1000);
    expect(r.paidNow).toBe(400);
    expect(r.totalPaid).toBe(1900);
    expect(r.debt).toBe(600);
    expect(r.status).toBe("debt");
  });

  it("laisse le dossier en attente si rien n'est encaissé", () => {
    const r = computeCollection({ total: 2000, alreadyPaid: 0, payingNow: 0 });
    expect(r.debt).toBe(2000);
    expect(r.status).toBe("pending");
  });

  it("garde le statut dette quand un acompte existe et que rien n'est versé", () => {
    const r = computeCollection({ total: 2500, alreadyPaid: 1500, payingNow: 0 });
    expect(r.debt).toBe(1000);
    expect(r.status).toBe("debt");
  });

  it("signale et borne un versement supérieur au reste dû", () => {
    const r = computeCollection({ total: 2500, alreadyPaid: 1500, payingNow: 4000 });
    expect(r.exceeds).toBe(true);
    expect(r.paidNow).toBe(1000);
    expect(r.debt).toBe(0);
  });

  it("borne un acompte antérieur incohérent au montant total", () => {
    const r = computeCollection({ total: 1000, alreadyPaid: 5000, payingNow: null });
    expect(r.priorPaid).toBe(1000);
    expect(r.outstandingBefore).toBe(0);
    expect(r.debt).toBe(0);
  });

  it("ne produit jamais de dette négative", () => {
    for (const payingNow of [-500, 0, 999, 1000, 99999]) {
      const r = computeCollection({ total: 2500, alreadyPaid: 1500, payingNow });
      expect(r.debt).toBeGreaterThanOrEqual(0);
      expect(r.paidNow).toBeGreaterThanOrEqual(0);
      expect(r.totalPaid).toBeLessThanOrEqual(r.total);
    }
  });

  it("garde amount - debt_amount égal au cumul réglé (base du calcul des revenus)", () => {
    const r = computeCollection({ total: 2500, alreadyPaid: 1500, payingNow: 400 });
    expect(r.total - r.debt).toBe(r.totalPaid);
  });

  it("tolère un montant total invalide", () => {
    const r = computeCollection({ total: 0, alreadyPaid: 0, payingNow: null });
    expect(r.total).toBe(0);
    expect(r.status).toBe("pending");
  });

  it("arrondit au centime", () => {
    const r = computeCollection({ total: 1000.555, alreadyPaid: 333.333, payingNow: 100.111 });
    expect(r.debt).toBe(round2(1000.56 - 333.33 - 100.11));
    function round2(n: number) {
      return Math.round(n * 100) / 100;
    }
  });
});

describe("priorPaidOf", () => {
  it("déduit la part réglée d'une dette", () => {
    expect(priorPaidOf({ amount: 2500, status: "debt", debt_amount: 1000 })).toBe(1500);
  });

  it("renvoie 0 pour un paiement soldé", () => {
    expect(priorPaidOf({ amount: 2500, status: "completed", debt_amount: 0 })).toBe(0);
  });

  it("renvoie 0 pour un paiement en attente", () => {
    expect(priorPaidOf({ amount: 2500, status: "pending", debt_amount: 0 })).toBe(0);
  });

  it("renvoie 0 sans paiement", () => {
    expect(priorPaidOf(null)).toBe(0);
  });

  it("ne renvoie jamais de valeur négative", () => {
    expect(priorPaidOf({ amount: 1000, status: "debt", debt_amount: 5000 })).toBe(0);
  });
});
