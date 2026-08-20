import { useTranslation } from 'react-i18next';
import './BrandStory.css';

const BrandStory = ({ goToShop }) => {
  const { t } = useTranslation();
  return (
    <section className="section brand-story" id="about">
      <div className="container">
        <div className="story-grid">
          <div className="story-image-container animate-fade-in">
             <img src="/images/story_craft_1783185889975.png" alt="Crafting jewelry" className="story-image"/>
          </div>
          <div className="story-content">
            <h2 className="story-title animate-fade-up">{t('brand_story.title')}</h2>
            <h3 className="story-subtitle animate-fade-up delay-100">{t('brand_story.subtitle')}</h3>
            <p className="story-text animate-fade-up delay-200">
              {t('brand_story.text_1')}
            </p>
            <p className="story-text animate-fade-up delay-300">
              {t('brand_story.text_2')}
            </p>
            <div className="animate-fade-up delay-400">
              <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => goToShop ? goToShop() : null}>
                {t('brand_story.cta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
