import { describe, it, expect } from 'vitest';
import { classifyDrug, classifyAllergyText, checkAllergy } from './index';
import medicationsData from '../../../main/database/medications_data.json';

interface RawMedication {
  brand_name: string;
  dci?: string;
}

const MEDICATIONS = medicationsData as RawMedication[];

describe('classifyDrug', () => {
  it('classifies a brand name via its DCI, not the brand itself', () => {
    // « CLAMOXYL » ne contient aucun indice ; toute l'information est dans la DCI.
    expect(classifyDrug('CLAMOXYL')).toEqual([]);
    expect(classifyDrug('CLAMOXYL', 'AMOXICILLINE TRIHYDRATE EXPRIME EN AMOXICILLINE'))
      .toContain('penicillines');
  });

  it('handles the salts and expansions used by the national nomenclature', () => {
    expect(classifyDrug(undefined, "AMOXICILLINE SOUS FORME TRIHYDRATEE")).toContain('penicillines');
    expect(classifyDrug(undefined, "VANCOMYCINE** (SOUS FORME DE CHLORHYDRATE)")).toContain('glycopeptides');
  });

  it('splits combination products and classifies each active principle', () => {
    const families = classifyDrug(undefined, 'AMOXICILLINE/ACIDE CLAVULANIQUE');
    expect(families).toContain('penicillines');
  });

  it('tolerates the typos present in the official nomenclature', () => {
    // Coquilles réelles du répertoire : CIOROFLOXACINE (ciprofloxacine),
    // CEFELAXINE (céfalexine), CAFACLOR (céfaclor).
    expect(classifyDrug(undefined, 'CIOROFLOXACINE SOUS FORME HYDROCHLORIDE')).toContain('quinolones');
    expect(classifyDrug(undefined, 'CEFELAXINE MONOHYDRATE')).toContain('cephalosporines');
    expect(classifyDrug(undefined, 'CEFACLOR MONOHYDRATE EXPRIME EN CAFACLOR')).toContain('cephalosporines');
  });

  it('returns an empty list for an unknown or empty drug', () => {
    expect(classifyDrug('', '')).toEqual([]);
    expect(classifyDrug(undefined, undefined)).toEqual([]);
    expect(classifyDrug('SIROP MAISON')).toEqual([]);
  });
});

describe('classifyAllergyText', () => {
  it('recognizes a family from the free-text allergy field', () => {
    expect(classifyAllergyText('Allergie à la pénicilline')).toContain('penicillines');
    expect(classifyAllergyText('allergie aux sulfamides')).toContain('sulfamides_antibacteriens');
    expect(classifyAllergyText('AINS')).toContain('ains');
  });

  it('is accent-insensitive', () => {
    // Le bug historique de PrescriptionQuickModal : « pénicilline » accentué
    // n'était jamais reconnu.
    expect(classifyAllergyText('pénicilline')).toContain('penicillines');
    expect(classifyAllergyText('penicilline')).toContain('penicillines');
  });

  it('returns an empty list when nothing is declared', () => {
    expect(classifyAllergyText(undefined)).toEqual([]);
    expect(classifyAllergyText('')).toEqual([]);
    expect(classifyAllergyText('poussière, pollen')).toEqual([]);
  });

  it('does not fire on ordinary French words containing a short alias', () => {
    // Régression : « ains », « iode » et « iec » sont des alias légitimes mais
    // apparaissent dans certAINS, pérIODE, pIECe. Une alerte fantôme apprend
    // au médecin à ignorer les vraies — la comparaison est bornée aux mots.
    expect(classifyAllergyText('allergie à certains aliments')).toEqual([]);
    expect(classifyAllergyText('douleurs en période de règles')).toEqual([]);
    expect(classifyAllergyText('allergie pièce métallique')).toEqual([]);
  });

  it('still recognizes those aliases as standalone words', () => {
    expect(classifyAllergyText('allergie aux AINS')).toContain('ains');
    expect(classifyAllergyText('allergie à l\'iode')).toContain('iode_contraste');
  });
});

describe('checkAllergy — the failure this work exists to fix', () => {
  /**
   * Régression pilotée par les données : toutes les spécialités de la famille
   * des pénicillines du répertoire embarqué doivent alerter pour un patient
   * déclaré allergique à la pénicilline. Avant ce correctif, le taux d'échec
   * mesuré était de 100 % (0/38).
   */
  const penicillinBrands = [
    ...new Map(
      MEDICATIONS
        .filter(m => /amoxicill|penicill|ampicill/i.test(m.dci || ''))
        .map(m => [m.brand_name, m])
    ).values(),
  ];

  it('has penicillin-family products to test against', () => {
    expect(penicillinBrands.length).toBeGreaterThanOrEqual(30);
  });

  it.each(penicillinBrands.map(m => [m.brand_name, m.dci] as const))(
    'warns for %s on a penicillin-allergic patient',
    (brand, dci) => {
      const warning = checkAllergy(brand, dci, 'Allergie à la pénicilline');
      expect(warning).not.toBeNull();
      expect(warning!.severity).toBe('danger');
      expect(warning!.familyId).toBe('penicillines');
    }
  );
});

describe('checkAllergy — severity', () => {
  it('reports a direct family match as danger', () => {
    const w = checkAllergy('CLAMOXYL', 'AMOXICILLINE TRIHYDRATE', 'Allergie à la pénicilline');
    expect(w?.severity).toBe('danger');
    expect(w?.familyLabel).toBe('Pénicillines');
  });

  it('reports a known cross-reaction as warning, not danger', () => {
    const w = checkAllergy('ROCEPHINE', 'CEFTRIAXONE SODIQUE', 'allergie pénicilline');
    expect(w?.severity).toBe('warning');
    expect(w?.familyId).toBe('cephalosporines');
    expect(w?.allergyLabel).toBe('Pénicillines');
    expect(w?.note).toMatch(/croisée/i);
  });

  it('prefers a direct match over a cross-reaction', () => {
    // Patient allergique aux deux : on doit annoncer le danger direct.
    const w = checkAllergy('ROCEPHINE', 'CEFTRIAXONE', 'allergie pénicilline et céphalosporines');
    expect(w?.severity).toBe('danger');
    expect(w?.familyId).toBe('cephalosporines');
  });
});

describe('checkAllergy — false positives must stay false', () => {
  it('does not confuse a sulfate salt with a sulfonamide', () => {
    // Piège vérifié : « MORPHINE SULFATE » existe dans le répertoire ; une règle
    // naïve sur « sulfa » en ferait un sulfamide.
    expect(checkAllergy('SKENAN', 'MORPHINE SULFATE', 'allergie aux sulfamides')).toBeNull();
  });

  it('does not confuse a glycopeptide with a macrolide', () => {
    // Piège vérifié : une règle naïve sur « mycine » classerait la vancomycine
    // parmi les macrolides.
    expect(checkAllergy('VANCOCINE', 'VANCOMYCINE', 'allergie aux macrolides')).toBeNull();
  });

  it('does not confuse topical salicylic acid with aspirin', () => {
    // L'acide salicylique kératolytique d'une crème n'est pas un salicylé
    // au sens allergique.
    expect(checkAllergy('DIPROSALIC', 'BETHAMETHASONE/ACIDE SALICYLIQUE', 'allergie aspirine')).toBeNull();
    // …mais un vrai salicylate doit bien alerter.
    expect(checkAllergy('ASPEGIC', 'ACETYLSALICYLATE DE DL LYSINE', 'allergie aspirine')?.severity)
      .toBe('danger');
  });

  it('does not warn for an unrelated drug', () => {
    expect(checkAllergy('DOLIPRANE', 'PARACETAMOL', 'Allergie à la pénicilline')).toBeNull();
  });

  it('does not warn when the patient has no declared allergy', () => {
    expect(checkAllergy('CLAMOXYL', 'AMOXICILLINE', undefined)).toBeNull();
    expect(checkAllergy('CLAMOXYL', 'AMOXICILLINE', '')).toBeNull();
  });

  it('does not warn when the drug cannot be classified', () => {
    expect(checkAllergy('PRODUIT INCONNU', undefined, 'Allergie à la pénicilline')).toBeNull();
  });
});

describe('checkAllergy — no penicillin stem leaks into another family', () => {
  it('classifies every distinct DCI without contradiction', () => {
    // Garde-fou : le motif « cilline » ne doit pas capturer de molécule
    // étrangère à la famille des pénicillines dans tout le répertoire.
    const offenders = [...new Set(MEDICATIONS.map(m => m.dci).filter(Boolean) as string[])]
      .filter(dci => classifyDrug(undefined, dci).includes('penicillines'))
      .filter(dci => !/amoxicill|penicill|ampicill|cloxacill|oxacill|piperacill|ticarcill|bacampicill/i.test(dci));
    expect(offenders).toEqual([]);
  });
});
