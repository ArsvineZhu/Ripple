import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<IslandController, 'clipboard' | 'copyToClipboard' | 'textColor'>;
export function ClipboardTab({ clipboard, copyToClipboard, textColor }: Props) {
  return (
    <div id="clipboard" style={{ animation: 'none' }}>
      {clipboard.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 30 }}>Clipboard is empty</p>
      ) : (
        clipboard.map((item, index) => (
          <div className="clipboard-row" key={index}>
            <p className="clipboard-content" style={{ paddingRight: '45px' }}>
              {item}
            </p>
            <button
              onClick={(e) => {
                copyToClipboard(item);
                const btn = e.currentTarget;
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.style.backgroundColor = 'rgba(52, 199, 89, 0.4)';
                setTimeout(() => {
                  btn.innerText = originalText;
                  btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }, 2000);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '5px',
                color: textColor,
                fontSize: '10px',
                padding: '3px 7px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              Copy
            </button>
          </div>
        ))
      )}
    </div>
  );
}
