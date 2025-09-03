import React, { useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  seriesData, 
  moviesData, 
  channelsData, 
  issueTypes, 
  contentTypes 
} from '@/data/contentData';
import { AlertTriangle, CheckCircle, Rocket, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { Link } from 'react-router-dom';

interface FormData {
  contentType: string;
  series?: string;
  season?: string;
  episode?: string;
  movieCategory?: string;
  movie?: string;
  country?: string;
  channel?: string;
  issueType: string;
}

export const IssueReportForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    contentType: '',
    issueType: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { submitIssue, isLoading, error, isConfigured } = useGoogleSheets();

  const handleContentTypeChange = (contentType: string) => {
    setFormData({
      contentType,
      issueType: formData.issueType
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contentType || !formData.issueType) {
      return;
    }

    // Build details string based on content type
    let details = '';
    switch (formData.contentType) {
      case 'series':
        details = `${formData.series}, ${formData.season}, ${formData.episode}`;
        break;
      case 'movie':
        details = `${formData.movieCategory}, ${formData.movie}`;
        break;
      case 'channel':
        details = `${formData.country}, ${formData.channel}`;
        break;
    }

    const issueData = {
      contentType: contentTypes.find(ct => ct.value === formData.contentType)?.label || formData.contentType,
      details,
      issueType: formData.issueType,
      timestamp: new Date().toLocaleString('he-IL')
    };

    const success = await submitIssue(issueData);
    
    if (success) {
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          contentType: '',
          issueType: ''
        });
      }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md bg-gradient-card border-primary/20 shadow-glow animate-pulse-glow">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="w-16 h-16 text-primary mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            תודה! הפנייה התקבלה
          </h3>
          <p className="text-muted-foreground">
            הדיווח יטופל בקרוב
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSeriesOptions = () => Object.keys(seriesData);
  const getSeasonOptions = () => formData.series ? seriesData[formData.series as keyof typeof seriesData]?.seasons || [] : [];
  const getEpisodeOptions = () => {
    if (formData.series && formData.season) {
      const series = seriesData[formData.series as keyof typeof seriesData];
      return series?.episodes[formData.season as keyof typeof series.episodes] || [];
    }
    return [];
  };

  const getMovieCategoryOptions = () => Object.keys(moviesData);
  const getMovieOptions = () => formData.movieCategory ? moviesData[formData.movieCategory as keyof typeof moviesData] || [] : [];

  const getCountryOptions = () => Object.keys(channelsData);
  const getChannelOptions = () => formData.country ? channelsData[formData.country as keyof typeof channelsData] || [] : [];

  const isFormValid = () => {
    if (!formData.contentType || !formData.issueType) return false;
    
    switch (formData.contentType) {
      case 'series':
        return formData.series && formData.season && formData.episode;
      case 'movie':
        return formData.movieCategory && formData.movie;
      case 'channel':
        return formData.country && formData.channel;
      default:
        return false;
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Configuration Alert */}
      {!isConfigured && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <Settings className="h-4 w-4" />
          <AlertDescription className="text-right">
            <div className="flex items-center justify-between">
              <span>Google Sheets לא מוגדר.</span>
              <Link 
                to="/admin" 
                className="text-primary hover:text-primary-glow font-medium underline"
              >
                הגדר כעת
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-right">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-gradient-card border-primary/20 shadow-space animate-float">
        <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-primary rounded-full shadow-glow">
            <AlertTriangle className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          דיווח תקלות תוכן
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground text-right">
              סוג תוכן
            </label>
            <SearchableSelect
              options={contentTypes.map(ct => ct.label)}
              value={contentTypes.find(ct => ct.value === formData.contentType)?.label || ''}
              onValueChange={(value) => {
                const contentType = contentTypes.find(ct => ct.label === value)?.value || '';
                handleContentTypeChange(contentType);
              }}
              placeholder="בחר סוג תוכן"
            />
          </div>

          {/* Series Selection */}
          {formData.contentType === 'series' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  סדרה
                </label>
                <SearchableSelect
                  options={getSeriesOptions()}
                  value={formData.series || ''}
                  onValueChange={(value) => setFormData({...formData, series: value, season: '', episode: ''})}
                  placeholder="בחר סדרה"
                />
              </div>

              {formData.series && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground text-right">
                    עונה
                  </label>
                  <SearchableSelect
                    options={getSeasonOptions()}
                    value={formData.season || ''}
                    onValueChange={(value) => setFormData({...formData, season: value, episode: ''})}
                    placeholder="בחר עונה"
                  />
                </div>
              )}

              {formData.season && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground text-right">
                    פרק
                  </label>
                  <SearchableSelect
                    options={getEpisodeOptions()}
                    value={formData.episode || ''}
                    onValueChange={(value) => setFormData({...formData, episode: value})}
                    placeholder="בחר פרק"
                  />
                </div>
              )}
            </>
          )}

          {/* Movie Selection */}
          {formData.contentType === 'movie' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  קטגוריית סרטים
                </label>
                <SearchableSelect
                  options={getMovieCategoryOptions()}
                  value={formData.movieCategory || ''}
                  onValueChange={(value) => setFormData({...formData, movieCategory: value, movie: ''})}
                  placeholder="בחר קטגוריה"
                />
              </div>

              {formData.movieCategory && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground text-right">
                    סרט
                  </label>
                  <SearchableSelect
                    options={getMovieOptions()}
                    value={formData.movie || ''}
                    onValueChange={(value) => setFormData({...formData, movie: value})}
                    placeholder="בחר סרט"
                  />
                </div>
              )}
            </>
          )}

          {/* Channel Selection */}
          {formData.contentType === 'channel' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground text-right">
                  מדינה
                </label>
                <SearchableSelect
                  options={getCountryOptions()}
                  value={formData.country || ''}
                  onValueChange={(value) => setFormData({...formData, country: value, channel: ''})}
                  placeholder="בחר מדינה"
                />
              </div>

              {formData.country && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground text-right">
                    ערוץ
                  </label>
                  <SearchableSelect
                    options={getChannelOptions()}
                    value={formData.channel || ''}
                    onValueChange={(value) => setFormData({...formData, channel: value})}
                    placeholder="בחר ערוץ"
                  />
                </div>
              )}
            </>
          )}

          {/* Issue Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground text-right">
              סוג תקלה
            </label>
            <SearchableSelect
              options={issueTypes}
              value={formData.issueType}
              onValueChange={(value) => setFormData({...formData, issueType: value})}
              placeholder="בחר סוג תקלה"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={cn(
              "w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
              isFormValid() && "animate-pulse-glow"
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 animate-spin" />
                שולח...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                שלח דיווח
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
};