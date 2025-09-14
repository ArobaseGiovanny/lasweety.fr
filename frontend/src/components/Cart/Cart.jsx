import "./cart.scss";
import imgIconCart from "../../images/icon-cart.png";

function Cart() {
    return (
        <div className="cart">
            <div className="cart__container">
                <img src={imgIconCart} alt="Ourson tenant un panier" className="cart-icon"></img>
                <span>Panier</span>
            </div>
        </div>
    )
}

export default Cart;