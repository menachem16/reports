import { IssueReportForm } from '@/components/IssueReportForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-space flex items-center justify-center p-4" dir="rtl">
      <div className="relative">
        {/* Background Stars Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-1 h-1 bg-primary-glow rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-32 w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-40 w-1 h-1 bg-secondary rounded-full animate-pulse"></div>
          <div className="absolute bottom-40 right-10 w-2 h-2 bg-primary-glow rounded-full animate-pulse"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 animate-float">
              מרכז דיווח תקלות
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              דווח על תקלות בסדרות, סרטים וערוצים בצורה מהירה ויעילה
            </p>
          </div>
          
          <IssueReportForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
