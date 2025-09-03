import { useState } from 'react';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  webAppUrl: string;
  apiKey: string;
  sheetName: string;
}

interface IssueData {
  contentType: string;
  details: string;
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

      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
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

  const readData = async (range?: string): Promise<any[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getConfig();
      
      if (!config || !config.spreadsheetId || !config.apiKey) {
        throw new Error('הגדרות Google Sheets חסרות למשיכת נתונים');
      }

      const sheetRange = range || `${config.sheetName}!A:Z`;
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

  return {
    submitIssue,
    readData,
    isLoading,
    error,
    isConfigured: !!getConfig()?.webAppUrl
  };
};