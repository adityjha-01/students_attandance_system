const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Generate Excel report for a course
async function generateCourseExcel(req, res) {
    let connection;
    try {
        const { courseId } = req.params;
        const profId = req.user.id;
        
        connection = await getConnection();
        
        // Verify professor owns the course
        const courseCheck = await connection.execute(
            `SELECT c.*, p.name as prof_name, p.department 
             FROM courses c 
             JOIN professors p ON c.prof_id = p.prof_id
             WHERE c.course_id = :courseId AND c.prof_id = :profId`,
            [parseInt(courseId), profId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (courseCheck.rows.length === 0) {
            return errorResponse(res, 'Unauthorized or course not found', 403);
        }
        
        const course = courseCheck.rows[0];
        
        // Get all attendance records
        const attendanceData = await connection.execute(
            `SELECT 
                s.student_id,
                s.name as student_name,
                s.email,
                a.attendance_date,
                a.status
            FROM students s
            JOIN enrollments e ON s.student_id = e.student_id
            LEFT JOIN attendance a ON s.student_id = a.student_id AND a.course_id = e.course_id
            WHERE e.course_id = :courseId AND e.status = 'ACTIVE'
            ORDER BY s.student_id, a.attendance_date`,
            [parseInt(courseId)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Get attendance statistics
        const statsData = await connection.execute(
            `SELECT 
                s.student_id,
                s.name as student_name,
                COUNT(a.attendance_id) as total_classes,
                SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
                ROUND(
                    (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(a.attendance_id), 0), 
                    2
                ) as attendance_percentage
            FROM students s
            JOIN enrollments e ON s.student_id = e.student_id
            LEFT JOIN attendance a ON s.student_id = a.student_id AND a.course_id = e.course_id
            WHERE e.course_id = :courseId AND e.status = 'ACTIVE'
            GROUP BY s.student_id, s.name
            ORDER BY s.student_id`,
            [parseInt(courseId)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Student Attendance System';
        workbook.created = new Date();
        
        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Student ID', key: 'studentId', width: 15 },
            { header: 'Student Name', key: 'studentName', width: 25 },
            { header: 'Total Classes', key: 'totalClasses', width: 15 },
            { header: 'Present', key: 'present', width: 12 },
            { header: 'Absent', key: 'absent', width: 12 },
            { header: 'Attendance %', key: 'percentage', width: 15 }
        ];
        
        // Add course info header
        summarySheet.mergeCells('A1:F1');
        summarySheet.getCell('A1').value = `${course.COURSE_NAME} (${course.SUBJECT_CODE})`;
        summarySheet.getCell('A1').font = { size: 16, bold: true };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };
        
        summarySheet.addRow({});
        summarySheet.addRow({
            studentId: 'Professor:',
            studentName: course.PROF_NAME
        });
        summarySheet.addRow({
            studentId: 'Department:',
            studentName: course.DEPARTMENT
        });
        summarySheet.addRow({
            studentId: 'Credits:',
            studentName: course.CREDITS
        });
        summarySheet.addRow({});
        
        // Add header row
        const headerRow = summarySheet.addRow(['Student ID', 'Student Name', 'Total Classes', 'Present', 'Absent', 'Attendance %']);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        });
        
        // Add data rows
        statsData.rows.forEach(row => {
            const dataRow = summarySheet.addRow({
                studentId: row.STUDENT_ID,
                studentName: row.STUDENT_NAME,
                totalClasses: row.TOTAL_CLASSES || 0,
                present: row.PRESENT_COUNT || 0,
                absent: row.ABSENT_COUNT || 0,
                percentage: row.ATTENDANCE_PERCENTAGE ? `${row.ATTENDANCE_PERCENTAGE}%` : 'N/A'
            });
            
            // Color code attendance percentage
            const percentCell = dataRow.getCell(6);
            const percent = row.ATTENDANCE_PERCENTAGE || 0;
            if (percent >= 75) {
                percentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            } else if (percent >= 60) {
                percentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
            } else {
                percentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
                percentCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            }
        });
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="attendance-report-${course.SUBJECT_CODE}-${Date.now()}.xlsx"`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Generate Excel error:', error);
        return errorResponse(res, 'Failed to generate Excel report', 500, error.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

// Generate PDF report for a course
async function generateCoursePDF(req, res) {
    let connection;
    try {
        const { courseId } = req.params;
        const profId = req.user.id;
        
        connection = await getConnection();
        
        // Verify professor owns the course
        const courseCheck = await connection.execute(
            `SELECT c.*, p.name as prof_name, p.department 
             FROM courses c 
             JOIN professors p ON c.prof_id = p.prof_id
             WHERE c.course_id = :courseId AND c.prof_id = :profId`,
            [parseInt(courseId), profId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (courseCheck.rows.length === 0) {
            return errorResponse(res, 'Unauthorized or course not found', 403);
        }
        
        const course = courseCheck.rows[0];
        
        // Get attendance statistics
        const statsData = await connection.execute(
            `SELECT 
                s.student_id,
                s.name as student_name,
                s.email,
                COUNT(a.attendance_id) as total_classes,
                SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
                ROUND(
                    (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(a.attendance_id), 0), 
                    2
                ) as attendance_percentage
            FROM students s
            JOIN enrollments e ON s.student_id = e.student_id
            LEFT JOIN attendance a ON s.student_id = a.student_id AND a.course_id = e.course_id
            WHERE e.course_id = :courseId AND e.status = 'ACTIVE'
            GROUP BY s.student_id, s.name, s.email
            ORDER BY s.student_id`,
            [parseInt(courseId)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="attendance-report-${course.SUBJECT_CODE}-${Date.now()}.pdf"`
        );
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add title
        doc.fontSize(20)
           .text('Attendance Report', { align: 'center' })
           .moveDown();
        
        // Add course details
        doc.fontSize(14)
           .text(`Course: ${course.COURSE_NAME}`, { continued: true })
           .text(` (${course.SUBJECT_CODE})`)
           .fontSize(12)
           .text(`Professor: ${course.PROF_NAME}`)
           .text(`Department: ${course.DEPARTMENT}`)
           .text(`Credits: ${course.CREDITS}`)
           .text(`Generated: ${new Date().toLocaleDateString()}`)
           .moveDown(2);
        
        // Add table header
        doc.fontSize(10);
        const tableTop = doc.y;
        const rowHeight = 25;
        const colWidths = [60, 150, 80, 60, 60, 80];
        const headers = ['ID', 'Name', 'Total', 'Present', 'Absent', 'Percentage'];
        
        // Draw header
        let currentX = 50;
        doc.font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.text(header, currentX, tableTop, { width: colWidths[i], align: 'left' });
            currentX += colWidths[i];
        });
        
        // Draw header line
        doc.moveTo(50, tableTop + 15)
           .lineTo(540, tableTop + 15)
           .stroke();
        
        // Add data rows
        doc.font('Helvetica');
        let currentY = tableTop + rowHeight;
        
        statsData.rows.forEach((row, index) => {
            currentX = 50;
            const data = [
                row.STUDENT_ID.toString(),
                row.STUDENT_NAME,
                (row.TOTAL_CLASSES || 0).toString(),
                (row.PRESENT_COUNT || 0).toString(),
                (row.ABSENT_COUNT || 0).toString(),
                row.ATTENDANCE_PERCENTAGE ? `${row.ATTENDANCE_PERCENTAGE}%` : 'N/A'
            ];
            
            // Check if we need a new page
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
            
            data.forEach((text, i) => {
                doc.text(text, currentX, currentY, { width: colWidths[i], align: 'left' });
                currentX += colWidths[i];
            });
            
            currentY += rowHeight;
        });
        
        // Add footer
        doc.fontSize(8)
           .text(
               `Total Students: ${statsData.rows.length}`,
               50,
               doc.page.height - 50,
               { align: 'center' }
           );
        
        // Finalize PDF
        doc.end();
        
    } catch (error) {
        console.error('Generate PDF error:', error);
        if (!res.headersSent) {
            return errorResponse(res, 'Failed to generate PDF report', 500, error.message);
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

module.exports = {
    generateCourseExcel,
    generateCoursePDF
};
