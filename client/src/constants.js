export const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Administrateur chaine' },
  { value: 'ORG_ADMIN', label: 'Administrateur organisation' },
  { value: 'SITE_MANAGER', label: 'Responsable etablissement' },
  { value: 'EMPLOYEE', label: 'Employe' },
];

export const STORAGE_TYPES = [
  { value: 'FROID_POSITIF', label: 'Froid positif' },
  { value: 'FROID_NEGATIF', label: 'Froid negatif' },
  { value: 'CHAUD', label: 'Chaud' },
  { value: 'AMBIANT', label: 'Ambiant' },
];

export const EQUIPMENT_TYPES = [
  { value: 'FRIGO', label: 'Frigo' },
  { value: 'CONGELATEUR', label: 'Congelateur' },
  { value: 'CHAMBRE_FROIDE', label: 'Chambre froide' },
  { value: 'VITRINE_CHAUDE', label: 'Vitrine chaude' },
  { value: 'AMBIANT', label: 'Ambiant' },
];

export const MEAL_SERVICES = [
  { value: 'PETIT_DEJEUNER', label: 'Petit-dejeuner' },
  { value: 'DEJEUNER', label: 'Dejeuner' },
  { value: 'DINER', label: 'Diner' },
  { value: 'AUTRE', label: 'Autre' },
];

export const SERVICE_STAGES = [
  { value: 'DEBUT', label: 'Debut de service' },
  { value: 'MILIEU', label: 'Milieu de service' },
  { value: 'FIN', label: 'Fin de service' },
];

export const TASK_FREQUENCIES = [
  { value: 'QUOTIDIEN', label: 'Quotidien' },
  { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
  { value: 'MENSUEL', label: 'Mensuel' },
  { value: 'TRIMESTRIEL', label: 'Trimestriel' },
];

export const NC_SEVERITIES = [
  { value: 'MINEURE', label: 'Mineure', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MAJEURE', label: 'Majeure', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITIQUE', label: 'Critique', color: 'bg-red-100 text-red-800' },
];

export const NC_STATUSES = [
  { value: 'OUVERTE', label: 'Ouverte', color: 'bg-red-100 text-red-800' },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-orange-100 text-orange-800' },
  { value: 'RESOLUE', label: 'Resolue', color: 'bg-green-100 text-green-800' },
];

export const ACTION_STATUSES = [
  { value: 'A_FAIRE', label: 'A faire' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINEE', label: 'Terminee' },
];

export function labelFor(list, value) {
  const found = list.find((i) => i.value === value);
  return found ? found.label : value;
}

export function colorFor(list, value) {
  const found = list.find((i) => i.value === value);
  return found ? found.color : 'bg-slate-100 text-slate-800';
}
