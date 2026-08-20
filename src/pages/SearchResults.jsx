import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

const SearchResults = ({ query, onProductClick, addToCart, showToast }) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Failed to fetch search results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="search-results-page animate-fade-in" style={{ padding: '6rem 0', minHeight: '60vh' }}>
      <div className="container">
        <h1 className="section-title text-center">Search Results</h1>
        <p className="section-subtitle text-center" style={{ marginBottom: '3rem' }}>
          Showing results for "{query}"
        </p>

        {isLoading ? (
          <div className="text-center">Searching...</div>
        ) : results.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', backgroundColor: 'var(--color-bg-alt)', borderRadius: '12px' }}>
            <h3>No jewelry found</h3>
            <p style={{ color: 'var(--color-text-light)', marginTop: '0.5rem' }}>Try searching for a different keyword, category, or material.</p>
          </div>
        ) : (
          <div className="product-grid">
            {results.map((product, index) => (
              <div key={product.id} className={`animate-fade-up delay-${(index % 4) * 100}`}>
                <ProductCard 
                  {...product} 
                  onClick={() => onProductClick(product)} 
                  addToCart={addToCart} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
