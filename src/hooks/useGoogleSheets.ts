import { useState, useCallback } from 'react';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  webAppUrl: string;
  apiKey: string;
  sheetName: string;
}

interface IssueData {
  contentType: string;
  details?: string;
  series?: string;
  season?: string;
  episode?: string;
  movieCategory?: string;
  movie?: string;
  country?: string;
  channel?: string;
  issueType: string;
  timestamp: string;
}

export const useGoogleSheets = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getConfig = (): GoogleSheetsConfig | null => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    return savedConfig ? JSON.parse(savedConfig) : null;
  };

  const submitIssue = async (issueData: IssueData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getConfig();
      
      if (!config || !config.webAppUrl) {
        throw new Error('הגדרות Google Sheets לא נמצאו. נא להגדיר בדף האדמין.');
      }

      // Add sheet name based on content type and backup to דיווחי תקלות
      const targetSheet = getSheetNameByContentType(issueData.contentType);
      const dataWithSheet = {
        ...issueData,
        targetSheet: targetSheet
      };
      
      // Also send to backup sheet דיווחי תקלות
      const backupData = {
        ...issueData,
        targetSheet: 'דיווחי תקלות'
      };

      // Send to main sheet
      const response1 = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithSheet),
        mode: 'no-cors' // Required for Google Apps Script
      });

      // Send to backup sheet דיווחי תקלות
      const response2 = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
        mode: 'no-cors' // Required for Google Apps Script
      });

      // Note: With no-cors, we can't read the response
      // We assume success if no error is thrown
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בשליחת הנתונים';
      setError(errorMessage);
      console.error('Error submitting to Google Sheets:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getSheetNameByContentType = (contentType: string): string => {
    switch (contentType) {
      case 'סדרה':
        return 'סדרות';
      case 'סרט':
        return 'סרט';
      case 'ערוץ':
        return 'ערוצים';
      default:
        return 'דיווחי תקלות';
    }
  };

  const readData = async (sheetName: string, range?: string): Promise<any[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getConfig();
      
      if (!config || !config.spreadsheetId || !config.apiKey) {
        throw new Error('הגדרות Google Sheets חסרות למשיכת נתונים');
      }

      const sheetRange = range || `${sheetName}!A:Z`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${sheetRange}?key=${config.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`שגיאה בקריאת נתונים: ${response.status}`);
      }

      const data = await response.json();
      return data.values || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בקריאת הנתונים';
      setError(errorMessage);
      console.error('Error reading from Google Sheets:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const readMovies = useCallback(async (): Promise<{[key: string]: string[]} | null> => {
    const data = await readData('movies');
    if (!data || data.length < 2) return null;
    
    const result: {[key: string]: string[]} = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const category = row[1]; // קטגוריה (עמודה 2)
      const movie = row[2];    // סרט (עמודה 3)
      
      if (category && movie) {
        if (!result[category]) result[category] = [];
        if (!result[category].includes(movie)) result[category].push(movie);
      }
    }
    
    return result;
  }, []);

  const readSeries = useCallback(async (): Promise<{[key: string]: {seasons: string[], episodes: {[key: string]: string[]}}} | null> => {
    const data = await readData('series');
    if (!data || data.length < 2) return null;
    
    const result: {[key: string]: {seasons: string[], episodes: {[key: string]: string[]}}} = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const series = row[1];  // סדרה (עמודה 2)
      const season = row[2];  // עונה (עמודה 3)
      const episode = row[3]; // פרק (עמודה 4)
      
      if (series && season && episode) {
        if (!result[series]) {
          result[series] = { seasons: [], episodes: {} };
        }
        
        if (!result[series].seasons.includes(season)) {
          result[series].seasons.push(season);
        }
        
        if (!result[series].episodes[season]) {
          result[series].episodes[season] = [];
        }
        
        if (!result[series].episodes[season].includes(episode)) {
          result[series].episodes[season].push(episode);
        }
      }
    }
    
    return result;
  }, []);

  const readChannels = useCallback(async (): Promise<{[key: string]: string[]} | null> => {
    const data = await readData('channels');
    if (!data || data.length < 2) return null;
    
    const result: {[key: string]: string[]} = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // מנסה למצוא את המבנה הנכון מהנתונים הקיימים
      let country = '';
      let channel = '';
      
      // חיפוש אחר ערוצים בפורמט הנכון
      if (row.length >= 2 && row[0] && row[1]) {
        // אם יש שני ערכים, נניח שהראשון הוא מדינה והשני ערוץ
        if (row[0].length > 1 && row[1].length > 1) {
          country = row[0];
          channel = row[1];
        }
      }
      
      if (country && channel && country !== 'ערוץ' && channel !== 'ערוץ') {
        if (!result[country]) result[country] = [];
        if (!result[country].includes(channel)) result[country].push(channel);
      }
    }
    
    return result;
  }, []);

  return {
    submitIssue,
    readData,
    readMovies,
    readSeries,
    readChannels,
    isLoading,
    error,
    isConfigured: !!getConfig()?.webAppUrl
  };
};