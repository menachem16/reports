import { useState } from 'react';

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

      // Add sheet name based on content type
      const dataWithSheet = {
        ...issueData,
        targetSheet: getSheetNameByContentType(issueData.contentType)
      };

      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithSheet),
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

  const readMovies = async (): Promise<{[key: string]: string[]} | null> => {
    const data = await readData('movies');
    if (!data || data.length < 2) return null;
    
    const result: {[key: string]: string[]} = {};
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const category = row[0];
      const movie = row[1];
      
      if (category && movie) {
        if (!result[category]) result[category] = [];
        result[category].push(movie);
      }
    }
    
    return result;
  };

  const readSeries = async (): Promise<{[key: string]: {seasons: string[], episodes: {[key: string]: string[]}}} | null> => {
    const data = await readData('series');
    if (!data || data.length < 2) return null;
    
    const result: {[key: string]: {seasons: string[], episodes: {[key: string]: string[]}}} = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const series = row[0];
      const season = row[1];
      const episode = row[2];
      
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
  };

  const readChannels = async (): Promise<{[key: string]: string[]} | null> => {
    const data = await readData('channels');
    if (!data || data.length < 2) return null;
    
    const result: {[key: string]: string[]} = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const country = row[0];
      const channel = row[1];
      
      if (country && channel) {
        if (!result[country]) result[country] = [];
        result[country].push(channel);
      }
    }
    
    return result;
  };

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