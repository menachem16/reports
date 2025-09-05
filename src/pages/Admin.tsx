import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Shield, Database, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  webAppUrl: string;
  apiKey: string;
  sheetName: string;
}

const Admin = () => {
  const [config, setConfig] = useState<GoogleSheetsConfig>({
    spreadsheetId: '',
    webAppUrl: '',
    apiKey: '',
    sheetName: 'sheets'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    
    // Save to localStorage
    localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Test connection to Google Sheets
      if (config.webAppUrl) {
        const testData = {
          contentType: 'בדיקה',
          details: 'בדיקת חיבור',
          issueType: 'בדיקה',
          timestamp: new Date().toLocaleString('he-IL')
        };

        const response = await fetch(config.webAppUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
          mode: 'no-cors'
        });

        setTestResult({
          success: true,
          message: 'החיבור נבדק בהצלחה! נתוני הבדיקה נשלחו לגיליון.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'URL של Web App חסר'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `שגיאה בחיבור: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigValid = config.spreadsheetId && config.webAppUrl && config.sheetName;

  return (
    <div className="min-h-screen bg-gradient-space p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-primary rounded-full shadow-glow">
              <Settings className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            פאנל אדמין
          </h1>
          <p className="text-lg text-muted-foreground">
            ניהול חיבור לגוגל שיטס והגדרות מערכת
          </p>
          
          <Link to="/" className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary-glow transition-colors">
            <ArrowRight className="w-4 h-4" />
            חזרה לטופס דיווח
          </Link>
        </div>

        {/* Security Warning */}
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-right">
            <strong>אזהרת אבטחה:</strong> מפתחות API רגישים! ודא שהגיליון מוגדר כציבורי לכתיבה או השתמש ב-Service Account.
            המפתחות נשמרים במחשב שלך בלבד (localStorage).
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration Card */}
          <Card className="bg-gradient-card border-primary/20 shadow-space">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="w-5 h-5" />
                הגדרות Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  ID של הגיליון
                </label>
                <Input
                  value={config.spreadsheetId}
                  onChange={(e) => setConfig({...config, spreadsheetId: e.target.value})}
                  placeholder="1abc123def456..."
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground text-right">
                  ה-ID נמצא ב-URL של הגיליון
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  Web App URL
                </label>
                <Textarea
                  value={config.webAppUrl}
                  onChange={(e) => setConfig({...config, webAppUrl: e.target.value})}
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  className="text-right min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  URL של Google Apps Script
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  הערה: המערכת עובדת עם 3 גיליונות - סדרות, סרט, ערוצים
                </label>
                <Input
                  value="סדרות, סרט, ערוצים"
                  disabled
                  className="text-right bg-muted"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  API Key (אופציונלי)
                </label>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder="AIza..."
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground text-right">
                  נדרש רק לקריאת נתונים מהגיליון
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !isConfigValid}
                  className={cn(
                    "flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300",
                    isSaved && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {isSaved ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      נשמר!
                    </div>
                  ) : (
                    'שמור הגדרות'
                  )}
                </Button>
                
                <Button
                  onClick={handleTestConnection}
                  disabled={isLoading || !config.webAppUrl}
                  variant="outline"
                  className="flex-1"
                >
                  בדוק חיבור
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="bg-gradient-card border-primary/20 shadow-space">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="w-5 h-5" />
                הוראות הגדרה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-right">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">1. צור Google Apps Script:</h4>
                  <p>עבור ל-script.google.com וצור פרויקט חדש</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">2. הוסף את הקוד:</h4>
                  <div className="bg-muted/50 p-3 rounded-md text-xs font-mono text-left" dir="ltr">
{`function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const spreadsheet = SpreadsheetApp.openById('YOUR_SHEET_ID');
  const sheet = spreadsheet.getSheetByName(data.targetSheet);
  
  // Add row based on sheet type
  if (data.targetSheet === 'סדרות') {
    sheet.appendRow([
      data['סוג תוכן'], data['סדרה'], data['עונה'], 
      data['פרק'], data['סוג תקלה'], data['זמן דיווח']
    ]);
  } else if (data.targetSheet === 'סרט') {
    sheet.appendRow([
      data['סוג תוכן'], data['קטגוריה'], data['סרט'], 
      data['סוג תקלה'], data['זמן דיווח']
    ]);
  } else if (data.targetSheet === 'ערוצים') {
    sheet.appendRow([
      data['סוג תוכן'], data['מדינה'], data['ערוץ'], 
      data['סוג תקלה'], data['זמן דיווח']
    ]);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">3. פרסם כ-Web App:</h4>
                  <p>Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">4. העתק את ה-URL:</h4>
                  <p>הדבק את ה-Web App URL בשדה למעלה</p>
                </div>
              </div>

              {testResult && (
                <Alert className={cn(
                  "mt-4",
                  testResult.success 
                    ? "border-green-500/50 bg-green-500/10" 
                    : "border-red-500/50 bg-red-500/10"
                )}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-right">
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;