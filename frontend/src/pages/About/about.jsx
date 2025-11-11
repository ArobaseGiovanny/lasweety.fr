import "./about.scss";

function About() {
  return (
<div className="aboutPage">
        <section className="about">
      <div className="about__content">
        <h1>À propos & Mentions légales</h1>

        <p>
          Bienvenue sur <strong>La Sweety</strong> — boutique en ligne dédiée à la vente de peluches.  
          En parcourant ce site, vous acceptez les présentes mentions légales et conditions d’utilisation.
        </p>

        <h2>Éditeur du site</h2>
        <p>
          <strong>La Sweety</strong><br />
          Auto-entreprise enregistrée au Registre du Commerce et des Sociétés de Paris<br />
          SIRET : 123 456 789 00010<br />
          Adresse : 10 Rue des Fleurs, 75000 Paris, France<br />
          Email : <a href="mailto:contact@lasweety.com">contact@lasweety.com</a><br />
          Responsable de publication : Laurinda Hayet
        </p>

        <h2>Hébergement du site</h2>
        <p>
        Le site <strong>lasweety.com</strong> est hébergé par :<br />
        <strong>Hostinger International Ltd</strong><br />
        Adresse : 61 Lordou Vironos Street, 6023 Larnaca, Chypre<br />
        Téléphone : +370 645 03378<br />
        Site web : <a href="https://www.hostinger.fr" target="_blank" rel="noreferrer">www.hostinger.fr</a><br />
        Email : <a href="mailto:support@hostinger.com">support@hostinger.com</a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L’ensemble du contenu de ce site (textes, visuels, logos, photos, vidéos, code source) est la propriété exclusive de <strong>La Sweety</strong> ou de ses partenaires.  
          Toute reproduction, diffusion ou exploitation, totale ou partielle, sans autorisation écrite préalable, est strictement interdite.
        </p>

        <h2>Produits & commandes</h2>
        <p>
          Les photographies et descriptions des produits sont fournies à titre indicatif et n’ont pas de valeur contractuelle.  
          La Sweety s’engage à honorer les commandes reçues dans la limite des stocks disponibles.  
          En validant sa commande, le client reconnaît avoir pris connaissance des conditions générales de vente.
        </p>

        <h2>Paiement sécurisé</h2>
        <p>
          Les paiements effectués sur <strong>lasweety.com</strong> sont sécurisés par la plateforme <strong>Stripe</strong>.  
          Les informations bancaires sont chiffrées et ne sont jamais transmises à La Sweety.
        </p>

        <h2>Livraison</h2>
        <p>
          La Sweety expédie ses produits en France métropolitaine et en Belgique via Chronopost.
          Les délais de livraison indiqués sur le site sont donnés à titre indicatif et peuvent varier selon les périodes.
        </p>

        <h2>Droit de rétractation</h2>
        <p>
          Conformément à l’article L.221-18 du Code de la consommation, le client dispose d’un délai de <strong>14 jours</strong> à compter de la réception de la commande pour exercer son droit de rétractation, sans avoir à justifier de motifs.  
          Les produits doivent être retournés dans leur état d’origine. Les frais de retour restent à la charge du client.
        </p>

        <h2>Protection des données personnelles</h2>
        <p>
          Les données collectées lors d’une commande ou d’un contact (nom, adresse, email, téléphone) sont utilisées uniquement pour le traitement de la commande et la communication client.  
          Ces données sont confidentielles et ne sont jamais vendues ni partagées à des tiers non autorisés.  
          Conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong>, vous disposez d’un droit d’accès, de rectification et de suppression de vos informations personnelles en écrivant à :{" "}
          <a href="mailto:contact@lasweety.com">contact@lasweety.com</a>.
        </p>

        <h2>Cookies</h2>
        <p>
          Le site n'utilise pas de cookies. Un stockage local (localStoage) est utilisé uniquement pour conserver l'historique du panier de l'utilisateur entre deux visites. Ces données ne sont jamais transmises à des tiers.
        </p>

        <h2>Responsabilité</h2>
        <p>
          La Sweety s’efforce de garantir l’exactitude et la mise à jour des informations publiées, mais ne saurait être tenue responsable des erreurs, omissions ou interruptions du site.  
          L’utilisateur accède au site sous sa propre responsabilité.
        </p>

        <h2>Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français.  
          En cas de litige, et à défaut de résolution amiable, le tribunal compétent sera celui du lieu du siège social de La Sweety.
        </p>

        <h2>Développeur du site</h2>
        <p>Le site lasweety.com a été entièrement développé et est mis à jour par Giovanny D. sans CMS externe. Si vous rencontrez un problème, veuillez envoyer un mail à <a href="mailto:contact@lasweety.com">contact@lasweety.com</a>.</p>
      </div>
    </section>
</div>
  );
}

export default About;
