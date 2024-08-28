const Order = require('../../model/user/orderModel')
const PDFDocument = require('pdfkit')



const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Received request to download invoice for order:', orderId);

        const order = await Order.findById(orderId)
            .populate('userId')
            .populate('productItems.productId');

        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ error: 'Order not found' });
        }

        const PDFDocument = require('pdfkit');

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${orderId}.pdf`);
        
        doc.pipe(res);

        function drawLine(doc, startX, startY, endX, endY) {
            doc.moveTo(startX, startY).lineTo(endX, endY).stroke();
        }
        
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.fontSize(12).text(`Invoice #${orderId}`, { align: 'center' });
        doc.moveDown();
        
    
        doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 400, 120);
        doc.text(`Order #: ${orderId}`, 400);
        doc.text(`Payment Method: ${order.paymentMethod}`, 400);
        
        doc.text('Bill To:', 50, 200);
        doc.text(`${order.userName}`, 50, 215);
        order.billingAddress.forEach((address, index) => {
            doc.text(`${address.street}, ${address.city}, ${address.country}`, 50, 230 + (index * 15));
        });
        doc.text(`Email: ${order.userId.email}`);
   
        const tableTop = 300;
        doc.rect(50, tableTop, 510, 20).fill('#000000');
        doc.fillColor('#FFFFFF')
            .text('Item Description', 60, tableTop + 5, { width: 180 })
            .text('Quantity', 300, tableTop + 5, { width: 60 })
            .text('Unit Price', 360, tableTop + 5, { width: 80 })
            .text('Total', 480, tableTop + 5, { width: 80 });
        
        doc.fillColor('#000000');
        let itemY = tableTop + 30;

        const activeProductItems = order.productItems.filter(item => item.status !== 'Cancelled');

       
        activeProductItems.forEach(item => {
            doc.text(item.productName, 60, itemY, { width: 180 });
            doc.text(item.quantity.toString(), 310, itemY, { width: 60 });
            doc.text(`${item.offerPrice}`, 370, itemY, { width: 80 });
            doc.text(`${item.quantity * item.offerPrice}`, 480, itemY, { width: 80 });
            itemY += 20;
        });

        drawLine(doc, 50, tableTop, 560, tableTop); 
        drawLine(doc, 50, tableTop + 20, 560, tableTop + 20); 
        drawLine(doc, 50, tableTop, 50, itemY); 
        drawLine(doc, 290, tableTop, 290, itemY); 
        drawLine(doc, 360, tableTop, 360, itemY); 
        drawLine(doc, 460, tableTop, 460, itemY); 
        drawLine(doc, 560, tableTop, 560, itemY); 
        drawLine(doc, 50, itemY, 560, itemY); 
        
        const totalsY = itemY + 20;
        doc.text(`Original Price: ${order.originalPrice}`, 400, totalsY);
        doc.text(`Coupon Discount: ${order.couponDiscount}`, 400, totalsY + 20);
        doc.text(`Discounted Amount: ${order.discount}`, 400, totalsY + 40);
        doc.moveDown();
        doc.fontSize(12).text(`Total Price: ${order.totalPrice}`, 400, totalsY + 100);

        // Footer
        doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });
        
        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}




module.exports = {
    downloadInvoice
}