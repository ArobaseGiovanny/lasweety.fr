import { Link } from "react-router-dom";
import "./cancelPage.scss";

function CancelPage() {
  return (
    <div className="cancelPage">
      <div className="cancelPage__card">
        <h1 className="cancelPage__title">Paiement annulé ❌</h1>
        <p className="cancelPage__text">
          Votre commande n’a pas été validée. Vous pouvez réessayer ou revenir plus tard.
        </p>

        <Link to="/" className="cancelPage__button">
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

export default CancelPage;
