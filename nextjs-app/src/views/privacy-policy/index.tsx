
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const dutchContent = {
  title: 'Privacybeleid',
  sections: [
    {
      title: '1. Gegevensverzameling',
      content: 'Onze extensie verzamelt de volgende gegevens:\n- Locatiegegevens (alleen wanneer actief gebruikt)\n- Browservoorkeuren en instellingen\n- Gebruikersinteractiegegevens met de extensie'
    },
    {
      title: '2. Gebruik van Gegevens',
      content: 'De verzamelde gegevens worden gebruikt voor:\n- Het verbeteren van de gebruikerservaring\n- Het opslaan van gebruikersvoorkeuren\n- Het personaliseren van de extensiefunctionaliteit'
    },
    {
      title: '3. Gegevensbescherming',
      content: 'Wij nemen de bescherming van uw gegevens serieus en implementeren passende technische en organisatorische maatregelen.'
    },
    {
      title: '4. Gegevensopslag',
      content: 'Alle gegevens worden lokaal op uw apparaat opgeslagen en worden niet gedeeld met derden.'
    },
    {
      title: '5. Contact',
      content: 'Voor vragen over dit privacybeleid kunt u contact opnemen via: contact@remcostoeten.com'
    }
  ]
};

const englishContent = {
  title: 'Privacy Policy',
  sections: [
    {
      title: '1. Data Collection',
      content: 'Our extension collects the following data:\n- Location data (only when actively used)\n- Browser preferences and settings\n- User interaction data with the extension'
    },
    {
      title: '2. Use of Data',
      content: 'The collected data is used for:\n- Improving the user experience\n- Storing user preferences\n- Personalizing extension functionality'
    },
    {
      title: '3. Data Protection',
      content: 'We take the protection of your data seriously and implement appropriate technical and organizational measures.'
    },
    {
      title: '4. Data Storage',
      content: 'All data is stored locally on your device and is not shared with third parties.'
    },
    {
      title: '5. Contact',
      content: 'For questions about this privacy policy, you can contact us at: contact@remcostoeten.com'
    }
  ]
};

const PrivacyPolicyView: React.FC = () => {
  const [language, setLanguage] = useState<'nl' | 'en'>('en'); // Default to English
  const content = language === 'nl' ? dutchContent : englishContent;

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'nl' ? 'en' : 'nl');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <Link to="/">
            <Button variant="outline" className="border-border hover:bg-secondary/80 transition-all duration-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="border-border hover:bg-secondary/80 transition-all duration-300"
            onClick={toggleLanguage}
          >
            <Globe className="mr-2 h-4 w-4" />
            {language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}
          </Button>
        </div>
        
        <div className="glass-panel p-6 max-w-3xl mx-auto animate-fade-in-up">
          <h1 className="text-2xl font-bold mb-6">{content.title}</h1>
          
          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <div 
                key={index} 
                className="space-y-2 animate-fade-in-up" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h2 className="text-lg font-semibold text-accent">{section.title}</h2>
                <p className="whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;
