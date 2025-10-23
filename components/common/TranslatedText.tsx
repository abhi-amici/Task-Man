import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface TranslatedTextProps {
  children: string | undefined | null;
}

const TranslatedText: React.FC<TranslatedTextProps> = ({ children }) => {
    const { language, translateDynamic } = useLanguage();
    const [translatedText, setTranslatedText] = useState(children || '');
    const [isLoading, setIsLoading] = useState(false);

    // This effect handles resetting the component's state when the source text changes,
    // preventing stale translations from being displayed.
    const [prevChildren, setPrevChildren] = useState(children);
    if (children !== prevChildren) {
        setTranslatedText(children || '');
        setPrevChildren(children);
    }

    useEffect(() => {
        const originalText = children || '';
        let isMounted = true;

        if (language === 'en') {
            // If the language is English, ensure the component displays the original text.
            setTranslatedText(originalText);
            setIsLoading(false);
            return;
        }

        if (!originalText || translatedText !== originalText) {
            // Do nothing if there's no text, or if the text is already translated.
            return;
        }
        
        const doTranslate = async () => {
            setIsLoading(true);
            const result = await translateDynamic(originalText);
            if (isMounted) {
                setTranslatedText(result);
                setIsLoading(false);
            }
        };

        doTranslate();

        return () => {
            isMounted = false;
        };
    }, [children, language, translateDynamic, translatedText]);
    
    if (!children) return null;

    // Show a loader if we are actively fetching, or if we are in a non-English language
    // and the displayed text is still the original source, which means a translation is pending.
    // This derived state prevents a "flash of untranslated content".
    const showLoader = isLoading || (language !== 'en' && translatedText === children);

    if (showLoader) {
        return <span className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded" style={{color: 'transparent'}}>{children}</span>;
    }

    return <>{translatedText}</>;
};

export default TranslatedText;
