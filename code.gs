function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // החלף עם ה-ID של הגיליון שלך
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // קבל את שם הגיליון המתאים
    const sheetName = data.targetSheet || 'דיווחי תקלות';
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // אם הגיליון לא קיים, צור אותו
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
    // הוסף כותרות בהתאם לסוג התוכן
    if (sheetName === 'סדרות') {
      sheet.getRange(1, 1, 1, 6).setValues([['סוג תוכן', 'סדרה', 'עונה', 'פרק', 'סוג תקלה', 'תאריך']]);
    } else if (sheetName === 'סרט') {
      sheet.getRange(1, 1, 1, 5).setValues([['סוג תוכן', 'קטגוריה', 'סרט', 'סוג תקלה', 'תאריך']]);
    } else if (sheetName === 'ערוצים') {
      sheet.getRange(1, 1, 1, 5).setValues([['סוג תוכן', 'מדינה', 'ערוץ', 'סוג תקלה', 'תאריך']]);
    } else {
      sheet.getRange(1, 1, 1, 4).setValues([['סוג תוכן', 'פרטים', 'סוג תקלה', 'תאריך']]);
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
    } else {
      // פורמט ישן לתאימות לאחור
      rowData = [
        data.contentType,
        data.details || '',
        data.issueType,
        data.timestamp
      ];
    }
    
    sheet.appendRow(rowData);
    
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