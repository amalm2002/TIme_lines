const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Order = require('../../model/user/orderModel');

function generatePDF(reportData, overallSalesCount, overallOrderAmount, overallDiscount) {
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

    doc.fontSize(24).text('Sales Report', { align: 'center' });
    doc.moveDown(2);

    const headers = ['User Name', 'Product Name', 'Quantity', 'Original Price', 'Total Price', 'Coupon Discount', 'Payment Method', 'Status', 'Date'];
    const columnWidth = 90;
    let startX = 50;
    let startY = 100;

    headers.forEach((header, i) => {
        doc.fontSize(10).text(header, startX + (i * columnWidth), startY, { width: columnWidth, align: 'center' });
    });


    startY += 20;
    reportData.forEach((order, rowIndex) => {
        const y = startY + (rowIndex * 20);
        
        if (y > 500) { 
            doc.addPage();
            startY = 50;
            headers.forEach((header, i) => {
                doc.fontSize(10).text(header, startX + (i * columnWidth), startY, { width: columnWidth, align: 'center' });
            });
            startY += 20;
        }

        doc.fontSize(8);
        doc.text(order.userName, startX, y, { width: columnWidth, align: 'center' });
        doc.text(order.productName, startX + columnWidth, y, { width: columnWidth, align: 'center' });
        doc.text(order.productQuantity.toString(), startX + (columnWidth * 2), y, { width: columnWidth, align: 'center' });
        doc.text(`₹${order.originalPrice}`, startX + (columnWidth * 3), y, { width: columnWidth, align: 'center' });
        doc.text(`₹${order.totalPrice}`, startX + (columnWidth * 4), y, { width: columnWidth, align: 'center' });
        doc.text(`₹${order.couponDiscount}`, startX + (columnWidth * 5), y, { width: columnWidth, align: 'center' });
        doc.text(order.paymentMethod, startX + (columnWidth * 6), y, { width: columnWidth, align: 'center' });
        doc.text(order.status, startX + (columnWidth * 7), y, { width: columnWidth, align: 'center' });
        doc.text(order.dateOrdered, startX + (columnWidth * 8), y, { width: columnWidth, align: 'center' });
    });

    doc.addPage();
    doc.fontSize(14);
    doc.text('Overall Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Overall Sales Count: ${overallSalesCount}`);
    doc.text(`Overall Order Amount: ₹${overallOrderAmount}`);
    doc.text(`Overall Discount: ₹${overallDiscount}`);

    doc.end();
    return doc;
}


async function generateExcel(reportData, overallSalesCount, overallOrderAmount, overallDiscount) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'Product Name', key: 'productName', width: 20 },
        { header: 'Quantity', key: 'productQuantity', width: 15 },
        { header: 'Original Price', key: 'originalPrice', width: 15 },
        { header: 'Total Price', key: 'totalPrice', width: 15 },
        { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
        { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date ', key: 'dateOrdered', width: 20 },
    ];

    reportData.forEach(order => {
        worksheet.addRow(order);
    });

   
    worksheet.addRow([]);
    worksheet.addRow(['Overall Summary']);
    worksheet.addRow(['Overall Sales Count', overallSalesCount]);
    worksheet.addRow(['Overall Order Amount', `₹${overallOrderAmount}`]);
    worksheet.addRow(['Overall Discount', `₹${overallDiscount}`]);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}


const salesReport = async (req, res) => {
    try {
        const { reportType, startDate, endDate, downloadFormat } = req.body;

        if (reportType === 'custom' && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
        }

        let query = {};

        if (reportType === 'daily') {
            query = { dateOrdered: { $gte: new Date().setHours(0, 0, 0, 0), $lt: new Date().setHours(23, 59, 59, 999) } };
        } else if (reportType === 'weekly') {
            const today = new Date();
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            query = { dateOrdered: { $gte: firstDayOfWeek } };
        } else if (reportType === 'custom' && startDate && endDate) {
            query = { dateOrdered: { $gte: new Date(startDate), $lt: new Date(endDate) } };
        }

        const orders = await Order.find(query).populate('productItems.productId');

        const reportData = orders.flatMap(order => 
            order.productItems.map(item => ({
                userName: order.userName,
                originalPrice: order.originalPrice,
                totalPrice: order.totalPrice,
                couponDiscount: order.couponDiscount,
                paymentMethod: order.paymentMethod,
                status: order.status,
                dateOrdered: order.dateOrdered.toLocaleDateString(),
                productName: item.productName,
                productQuantity: item.quantity,
            }))
        );

        const overallSalesCount = orders.length;
        const overallOrderAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const overallDiscount = orders.reduce((sum, order) => sum + order.couponDiscount, 0);

        if (downloadFormat === 'pdf') {
            const doc = generatePDF(reportData, overallSalesCount, overallOrderAmount, overallDiscount);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

            doc.pipe(res);
        } else if (downloadFormat === 'excel') {
            console.log("Generating Excel report");

            const buffer = await generateExcel(reportData, overallSalesCount, overallOrderAmount, overallDiscount);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
            res.send(buffer);
        }
    } catch (error) {
        console.error("The error occurred in the generate report section:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    salesReport,
};




