'use client';

import { useState, useEffect } from 'react';
import { fetchCurrentStreamInfo, searchCategoriesAction, updateStreamAction } from '@/lib/actions';

export default function StreamManager() {
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // 1. Fetch current info on mount
  useEffect(() => {
    async function loadInfo() {
      const info = await fetchCurrentStreamInfo();
      if (info) {
        setTitle(info.title);
        setCategoryName(info.game_name);
        setCategoryId(info.game_id);
      }
      setStatus('idle');
    }
    loadInfo();
  }, []);

  // 2. Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setStatus('loading');
    const results = await searchCategoriesAction(searchQuery);
    setSearchResults(results);
    setStatus('idle');
  };

  // 3. Handle Select Category
  const handleSelectGame = (game: any) => {
    setCategoryName(game.name);
    setCategoryId(game.id);
    setSearchResults([]); // Hide results
    setSearchQuery(''); // Clear search
  };

  // 4. Handle Save
  const handleSave = async () => {
    setStatus('saving');
    setMessage('');
    
    const result = await updateStreamAction(title, categoryId);
    
    if (result.success) {
      setStatus('success');
      setMessage('Stream updated successfully!');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setMessage(result.error || 'Failed to update stream');
    }
  };

  if (status === 'loading' && !title) return <div>Loading stream info...</div>;

  return (
    <div>
      <h2>Stream Metadata</h2>
      
      {/* Title Input */}
      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>Stream Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Current Category Display */}
      <div>
        <label>Current Category</label>
        <div>
          {categoryName || 'None'}
        </div>
      </div>

      {/* Category Search */}
      <div>
        <label>Search New Category</label>
        <form onSubmit={handleSearch}>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a game and press enter..."
          />
          <button type="submit">
            Search
          </button>
        </form>

        {/* Search Results Dropdown-ish */}
        {searchResults.length > 0 && (
          <div>
            {searchResults.map((game) => (
              <div 
                key={game.id} 
                onClick={() => handleSelectGame(game)}
              >
                <img src={game.box_art_url.replace('{width}', '40').replace('{height}', '55')} alt={game.name}/>
                <span>{game.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button & Messages */}
      <div>
        <button 
          onClick={handleSave} 
          disabled={status === 'saving'}
        >
          {status === 'saving' ? 'Updating...' : 'Update Stream Info'}
        </button>
        
        {message && (
          <p>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}