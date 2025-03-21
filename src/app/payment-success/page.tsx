export default function PaymentSuccess() {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Płatność zakończona sukcesem!</h1>
        <p>Dziękujemy za zakup. Twoje kredyty zostały dodane do konta.</p>
        <a href="/dashboard" className="text-blue-500 underline">
          Wróć do panelu
        </a>
      </div>
    );
  }