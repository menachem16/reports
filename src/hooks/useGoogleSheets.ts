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

      // Send data to the correct sheet based on content type
      const targetSheet = getSheetNameByContentType(issueData.contentType);
      
      // Format data with English keys as expected by Google Apps Script
      let formattedData: any = {
        contentType: issueData.contentType,
        issueType: issueData.issueType,
        timestamp: new Date().toISOString(), // Send ISO format for proper parsing in GAS
        targetSheet: targetSheet
      };
      
      if (targetSheet === 'סדרות') {
        formattedData.series = issueData.series || '';
        formattedData.season = issueData.season || '';
        formattedData.episode = issueData.episode || '';
      } else if (targetSheet === 'סרטים') {
        formattedData.category = issueData.movieCategory || '';
        formattedData.movie = issueData.movie || '';
      } else if (targetSheet === 'ערוצים') {
        formattedData.country = issueData.country || '';
        formattedData.channel = issueData.channel || '';
      }

      console.log('Sending data to sheet:', targetSheet);
      console.log('Formatted data being sent:', formattedData);

      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
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
    console.log('getSheetNameByContentType called with:', contentType);
    switch (contentType) {
      case 'סדרה':
        console.log('Returning: סדרות');
        return 'סדרות';
      case 'סרט':
        console.log('Returning: סרטים');
        return 'סרטים';
      case 'ערוץ':
        console.log('Returning: ערוצים');
        return 'ערוצים';
      default:
        console.error('Unknown content type:', contentType);
        throw new Error(`סוג תוכן לא מזוהה: ${contentType}`);
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
      // המבנה: עמודה 0 = סוג תוכן, עמודה 1 = מדינה, עמודה 2 = ערוץ
      if (row.length >= 3) {
        const country = row[1]; // מדינה
        const channel = row[2]; // ערוץ
        
        if (country && channel && 
            country !== 'מדינה' && channel !== 'ערוץ' &&
            country.length > 1 && channel.length > 1) {
          if (!result[country]) result[country] = [];
          if (!result[country].includes(channel)) result[country].push(channel);
        }
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