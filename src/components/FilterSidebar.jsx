import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SteelIcon, XpAlloyIcon, ZirconiaIcon, LapisIcon } from './MaterialIcons';
import './FilterSidebar.css';

const FilterAccordion = ({ title, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`filter-accordion ${isOpen ? 'open' : ''}`}>
      <div className="filter-accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <h4>{title}</h4>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isOpen && <div className="filter-accordion-content">{children}</div>}
    </div>
  );
};

const FilterCheckbox = ({ label, icon, checked, onChange, intensity }) => {
  return (
    <label className="filter-checkbox-label">
      <div className="checkbox-wrapper">
        <input 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
        />
        <span className="checkmark"></span>
      </div>
      {icon && <span className="filter-icon">{icon}</span>}
      <span className="filter-text">{label}</span>
      {intensity && (
        <span className="intensity-bar">
          <span className={`bar-segment ${intensity >= 1 ? 'active' : ''}`}></span>
          <span className={`bar-segment ${intensity >= 2 ? 'active' : ''}`}></span>
          <span className={`bar-segment ${intensity >= 3 ? 'active' : ''}`}></span>
        </span>
      )}
    </label>
  );
};

const FilterSidebar = ({ activeFilters = [], onFilterChange }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(activeFilters);

  const handleToggle = (filterName) => {
    const newFilters = localFilters.includes(filterName)
      ? localFilters.filter(f => f !== filterName)
      : [...localFilters, filterName];
    
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const isChecked = (filterName) => localFilters.includes(filterName);

  return (
    <div className="filter-sidebar">
      <div className="filter-sort-by">
        <h4>{t('filter_sidebar.sort_by')}</h4>
        <div className="sort-dropdown">
          <span>{t('filter_sidebar.relevance')}</span>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="filter-sections">
        <h4 className="filters-title">{t('filter_sidebar.filters')}</h4>

        <FilterAccordion title={t('filter_sidebar.category')}>
          <FilterCheckbox label={t('filter_sidebar.rings')} checked={isChecked("Rings")} onChange={() => handleToggle("Rings")} />
          <FilterCheckbox label={t('filter_sidebar.necklaces')} checked={isChecked("Necklaces")} onChange={() => handleToggle("Necklaces")} />
          <FilterCheckbox label={t('filter_sidebar.bracelets')} checked={isChecked("Bracelets")} onChange={() => handleToggle("Bracelets")} />
          <FilterCheckbox label={t('filter_sidebar.earrings')} checked={isChecked("Earrings")} onChange={() => handleToggle("Earrings")} />
        </FilterAccordion>

        <FilterAccordion title={t('filter_sidebar.material')}>
          <FilterCheckbox label={t('filter_sidebar.stainless_steel')} icon={<SteelIcon size={18} />} checked={isChecked("Stainless Steel")} onChange={() => handleToggle("Stainless Steel")} />
          <FilterCheckbox label={t('filter_sidebar.xp_alloy')} icon={<XpAlloyIcon size={18} />} checked={isChecked("XP Alloy")} onChange={() => handleToggle("XP Alloy")} />
          <FilterCheckbox label={t('filter_sidebar.zirconia')} icon={<ZirconiaIcon size={18} />} checked={isChecked("Zirconia")} onChange={() => handleToggle("Zirconia")} />
          <FilterCheckbox label={t('filter_sidebar.lapis_lazuli')} icon={<LapisIcon size={18} />} checked={isChecked("Lapis Lazuli")} onChange={() => handleToggle("Lapis Lazuli")} />
        </FilterAccordion>

        <FilterAccordion title={t('filter_sidebar.size')}>
          <FilterCheckbox label={t('filter_sidebar.delicate')} intensity={1} checked={isChecked("Delicate")} onChange={() => handleToggle("Delicate")} />
          <FilterCheckbox label={t('filter_sidebar.standard')} intensity={2} checked={isChecked("Standard")} onChange={() => handleToggle("Standard")} />
          <FilterCheckbox label={t('filter_sidebar.statement')} intensity={3} checked={isChecked("Statement")} onChange={() => handleToggle("Statement")} />
        </FilterAccordion>

        <FilterAccordion title={t('filter_sidebar.price')} defaultOpen={false}>
          {/* Price slider would go here */}
          <div style={{ padding: '0.5rem 0', color: '#666', fontSize: '0.85rem' }}>{t('filter_sidebar.price_coming_soon')}</div>
        </FilterAccordion>
      </div>
    </div>
  );
};

export default FilterSidebar;
