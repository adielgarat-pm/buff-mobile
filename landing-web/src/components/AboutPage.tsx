import { useState } from 'react';
import { 
  ArrowRight, ArrowLeft, Heart, MessageCircle, Users, Sparkles, X,
  Lightbulb, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from './ui/separator';

interface AboutPageProps {
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToPhilosophy?: () => void;
}

export function AboutPage({ onBack, isModal, onClose, onNavigateToPhilosophy }: AboutPageProps) {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const handleWhatsAppContact = () => {
    window.open('https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5?mode=gi_t', '_blank');
  };

  const containerClass = isModal 
    ? 'max-h-[80vh] overflow-y-auto' 
    : 'min-h-[100dvh] bg-background overflow-x-hidden';

  return (
    <div className={`theme-parent-zen ${containerClass}`}>
      <div className={isModal ? 'p-6' : 'max-w-2xl mx-auto px-5 py-6 pb-24 safe-area-all'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground font-display">{t('about.title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{t('about.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {isModal && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
            )}
            {!isModal && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
                <BackArrow className="w-4 h-4 me-1" />
                {t('about.back')}
              </Button>
            )}
          </div>
        </div>

        {/* Creator Profile */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-bold">
              {isRTL ? 'ע' : 'A'}
            </AvatarFallback>
          </Avatar>
          <p className="text-lg text-foreground leading-relaxed max-w-md" dangerouslySetInnerHTML={{ __html: t('about.creatorIntro') }} />
        </div>

        {/* The Mission */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/20 shrink-0"><Sparkles className="w-5 h-5 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('about.missionTitle')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('about.missionContent')}</p>
            </div>
          </div>
        </div>

        {/* The Philosophy */}
        <div className="mb-6 p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-secondary shrink-0"><Lightbulb className="w-5 h-5 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('about.philosophyTitle')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('about.philosophyContent')}</p>
            </div>
          </div>
        </div>

        {/* Community & Contact */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-xl bg-accent/20 shrink-0"><Users className="w-5 h-5 text-accent" /></div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('about.communityTitle')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('about.communityContent')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleWhatsAppContact} className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
              <MessageCircle className="w-5 h-5 me-2" />
              {t('about.whatsappButton')}
            </Button>
            <Button asChild variant="outline" className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold rounded-xl">
              <a href="https://www.youtube.com/@buff.adhdapp" target="_blank" rel="noopener noreferrer">
                <svg className="w-5 h-5 me-2" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                {isRTL ? 'עקבו בערוץ YouTube' : 'Follow on YouTube'}
              </a>
            </Button>
          </div>
        </div>

        {/* Link to Philosophy Page */}
        {onNavigateToPhilosophy && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border">
            <Button variant="ghost" onClick={onNavigateToPhilosophy} className="w-full justify-center text-primary hover:bg-primary/10">
              <Lightbulb className="w-4 h-4 me-2" />
              {t('about.readPhilosophy')}
            </Button>
          </div>
        )}

        {/* Legal Disclaimer Section */}
        <div className="mt-8">
          <Separator className="mb-6" />
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted shrink-0"><AlertTriangle className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">{t('legal.title')}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('legal.disclaimer')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">{t('about.footer')}</p>
        </div>
      </div>
    </div>
  );
}
