function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', JSON.stringify(data));
    
    const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // החלף עם ה-ID של הגיליון שלך
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // קבל את שם הגיליון המתאים - ללא ברירת מחדל
    const sheetName = data.targetSheet;
    console.log('Target sheet name:', sheetName);
    
    // בדוק שהשם תקין - רק השמות המותרים
    const allowedSheets = ['סדרות', 'סרט', 'ערוצים'];
    if (!sheetName || !allowedSheets.includes(sheetName)) {
      console.error('Invalid sheet name:', sheetName);
      return ContentService
        .createTextOutput(JSON.stringify({success: false, error: 'Invalid sheet name: ' + sheetName}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let sheet = spreadsheet.getSheetByName(sheetName);
    console.log('Sheet exists:', !!sheet);
    
    // אם הגיליון לא קיים, צור אותו עם הכותרות המתאימות
    if (!sheet) {
      console.log('Creating new sheet:', sheetName);
      sheet = spreadsheet.insertSheet(sheetName);
      
      // הוסף כותרות בהתאם לסוג התוכן
      if (sheetName === 'סדרות') {
        sheet.getRange(1, 1, 1, 6).setValues([['סוג תוכן', 'סדרה', 'עונה', 'פרק', 'סוג תקלה', 'תאריך']]);
      } else if (sheetName === 'סרט') {
        sheet.getRange(1, 1, 1, 5).setValues([['סוג תוכן', 'קטגוריה', 'סרט', 'סוג תקלה', 'תאריך']]);
      } else if (sheetName === 'ערוצים') {
        sheet.getRange(1, 1, 1, 5).setValues([['סוג תוכן', 'מדינה', 'ערוץ', 'סוג תקלה', 'תאריך']]);
      }
    }
    
    // הוסף את הנתונים בהתאם לסוג התוכן
    let rowData = [];
    
    if (sheetName === 'סדרות') {
      rowData = [
        data.contentType,
        data.series || '',
        data.season || '',
        data.episode || '',
        data.issueType,
        data.timestamp
      ];
    } else if (sheetName === 'סרט') {
      rowData = [
        data.contentType,
        data.category || '',
        data.movie || '',
        data.issueType,
        data.timestamp
      ];
    } else if (sheetName === 'ערוצים') {
      rowData = [
        data.contentType,
        data.country || '',
        data.channel || '',
        data.issueType,
        data.timestamp
      ];
    }
    
    console.log('Row data to append:', JSON.stringify(rowData));
    sheet.appendRow(rowData);
    console.log('Data appended successfully to sheet:', sheetName);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, sheet: sheetName}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// פונקציה לקריאת נתונים (אופציונלית)
function doGet(e) {
  try {
    const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // החלף עם ה-ID של הגיליון שלך
    const sheetName = e.parameter.sheet || 'movies';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, error: 'Sheet not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, data: data}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}