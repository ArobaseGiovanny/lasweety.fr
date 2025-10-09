import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import ProductOverlay from "../../components/ProductOverlay/ProductOverlay";
import products from "../../data/products";

function PeluchesPage() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handlePelucheClick = (productId) => {
    const product = products[productId];
    if (product) {
      setSelectedProduct(product);
      setIsOverlayOpen(true);
    }
  };

  const handleChangeColor = (color) => {
    const colorToId = {
      orange: 101,
      bleu: 102,
      rose: 103,
      marron: 104,
    };
    const productId = colorToId[color];
    if (productId) {
      setSelectedProduct(products[productId]);
    }
  };


  return (
    <>
      <Hero onPelucheClick={handlePelucheClick} />
      <ProductOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        product={selectedProduct}
        onChangeColor={handleChangeColor}
      />
    </>
  );
}

export default PeluchesPage;
