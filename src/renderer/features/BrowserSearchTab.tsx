import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'browserSearch' | 'setBrowserSearch' | 'searchBrowser' | 'textColor'
>;
export function BrowserSearchTab({
  browserSearch,
  setBrowserSearch,
  searchBrowser,
  textColor,
}: Props) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <input
        id="browser-searchbar"
        placeholder="Search google or enter URL"
        value={browserSearch}
        onChange={(e) => setBrowserSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            searchBrowser();
          }
        }}
        style={{ color: textColor }}
      />
    </div>
  );
}
