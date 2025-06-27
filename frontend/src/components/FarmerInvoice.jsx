const FarmerInvoice = ({ farmer }) => {
  // Calculate total and final amount after discount
  const total = farmer.acres * farmer.pricePerAcre;
  const finalAmount = farmer.discount ? total - farmer.discount : total;

  return (
    <div className="invoice-page" style={{ 
      padding: '20px', 
      fontFamily: 'Arial', 
      maxWidth: '500px', 
      margin: '0 auto' 
    }}>
      <h2 style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
        FARMER INVOICE
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <p><strong>Invoice No:</strong> {farmer.invoiceNo}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Farmer Details:</h3>
        <p><strong>Name:</strong> {farmer.name}</p>
        <p><strong>District:</strong> {farmer.district}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Payment Details:</h3>
        <p><strong>Acres:</strong> {farmer.acres}</p>
        <p><strong>Price per Acre:</strong> ₹{farmer.pricePerAcre}</p>
        <p><strong>Total:</strong> ₹{total}</p>
        {farmer.discount > 0 && (
          <p><strong>Discount:</strong> ₹{farmer.discount}</p>
        )}
        <p style={{ fontWeight: 'bold' }}><strong>Final Amount:</strong> ₹{finalAmount}</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', fontStyle: 'italic' }}>
        <p>Thank you for your cooperation!</p>
      </div>
    </div>
  );
};

export default FarmerInvoice;