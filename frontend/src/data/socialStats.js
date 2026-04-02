// ============================================================
//  Statistiques réseaux sociaux — mise à jour manuelle
//  Fréquence recommandée : ~1 fois par semaine
//
//  Format : "+220K" | "+1,3M" | null (= non affiché)
//  Utiliser la virgule comme séparateur décimal (ex: "+1,3M")
//
//  Pour récupérer les chiffres YouTube à jour :
//    GET /api/youtube/subscribers  (retourne les valeurs brutes)
//    → arrondir et mettre à jour ci-dessous
//
//  Dernière mise à jour : 24 mars 2026
// ============================================================

const SOCIAL_STATS = {
  // ── La.sweety ──────────────────────────────────────────────
  lasweety_yt_main:    "+2,6M",  // @La.Sweety
  lasweety_yt_second:  "+181K",  // @lasweettv
  lasweety_instagram:  "+200k",     // @sweetyfamily.yt
  lasweety_tiktok:     "+1,8M",  // @la.sweety
  lasweety_snapchat:   "+590k",     // sweeyfamily.yt

  // ── Diolinda ───────────────────────────────────────────────
  diolinda_yt:         "+948K",  // @Diolindaa_
  diolinda_instagram:  "+200k",     // @diolinda_
  diolinda_tiktok:     "+700K",  // @diolindaa_
  diolinda_snapchat:   null,     // diolindaa_d

  // ── Lilow ──────────────────────────────────────────────────
  lilow_yt:            "+398K",  // @Lilowtresor
  lilow_instagram:     "+100k",     // @lilow_tresor
};

export default SOCIAL_STATS;
