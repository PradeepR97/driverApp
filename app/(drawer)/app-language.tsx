import { PlaceholderDrawerScreen } from '@/components/drawer/PlaceholderDrawerScreen';
import { useTranslation } from 'react-i18next';

export default function AppLanguageScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderDrawerScreen
      title={t('drawer.language_title')}
      subtitle={t('drawer.language_subtitle')}
    />
  );
}
