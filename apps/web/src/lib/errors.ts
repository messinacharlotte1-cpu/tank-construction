// Traduit un message d'erreur (souvent Supabase/Postgres brut) en français métier.
// Objectif : ne jamais exposer de jargon DB à l'utilisateur (érode la confiance).
export function humanError(msg?: string | null): string {
  const m = (msg ?? "").toLowerCase();
  if (!m) return "Une erreur est survenue. Réessayez.";
  if (m.includes("row-level") || m.includes("violates row-level")) return "Droits insuffisants pour cette action (votre rôle ne l'autorise pas).";
  if (m.includes("duplicate key") || m.includes("already exists") || (m.includes("unique") && m.includes("constraint"))) return "Cet enregistrement existe déjà.";
  if (m.includes("foreign key") || m.includes("still referenced")) return "Élément lié à d'autres données — supprimez d'abord ce qui en dépend.";
  if (m.includes("not null") || m.includes("null value")) return "Un champ obligatoire est vide.";
  if (m.includes("permission denied")) return "Accès refusé.";
  if (m.includes("jwt") || m.includes("token") || m.includes("expired") || m.includes("not authenticated")) return "Session expirée — reconnectez-vous.";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("timeout")) return "Problème de connexion. Vérifiez le réseau et réessayez.";
  return "Une erreur est survenue. Réessayez, ou contactez l'administrateur si ça persiste.";
}
